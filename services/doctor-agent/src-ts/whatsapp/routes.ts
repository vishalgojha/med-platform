import type { Express, Request, Response } from "express";
import twilio from "twilio";
import { getConfig } from "../config.js";
import { addDoctor, getDoctorById } from "../doctors/store.js";
import { appError, toStructuredError } from "../errors.js";
import {
  isRequestBodyLimitError,
  parseUrlEncodedFormBody,
  readRequestBodyWithLimit,
  requestBodyErrorToText
} from "../http/body-limit.js";
import { logger } from "../logger.js";
import {
  getSpecialtyValidationMessage,
  getWorkflowValidationMessage,
  normalizeSpecialtyId,
  parseLanguage,
  parseWorkflow
} from "../orchestration/router.js";
import { decryptSecret, encryptSecret } from "./crypto.js";
import {
  processInboundWhatsAppMessage,
  processTwilioInboundWhatsApp,
  validateWebhookPayload
} from "./agent-service.js";
import {
  addWhatsAppTenant,
  getWhatsAppTenantById,
  getWhatsAppTenantWithSecretsById,
  getWhatsAppTenantWithSecretsByNumber,
  listWhatsAppTenants,
  normalizeWhatsAppNumber,
  recordWhatsAppMessageEvent,
  updateWhatsAppTenantCredentials,
  updateWhatsAppTenantStatus
} from "./store.js";
import type { WhatsAppTenant } from "./types.js";
import { TenantWorkerManager } from "./worker-manager.js";
import { WhatsAppWebSessionManager } from "./web-session.js";

type RequireScope = (req: Request, res: Response, required: "read" | "write" | "admin") => boolean;
type SendJson = (res: Response, status: number, payload: unknown) => void;

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function requireString(body: Record<string, unknown>, field: string): string | null {
  const value = body[field];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

interface PublicTenant extends WhatsAppTenant {
  credentialsConfigured: boolean;
}

function mapPublicTenant(tenant: WhatsAppTenant): PublicTenant {
  return {
    ...tenant,
    credentialsConfigured: true
  };
}

async function sendViaWebSession(input: {
  tenantId: string;
  fromNumber: string;
  to: string;
  body: string;
  conversationId?: string;
}): Promise<{ providerMessageId: string; fromNumber: string; status: string }> {
  const sent = await webSessions.sendText(input.tenantId, input.to, input.body);
  recordWhatsAppMessageEvent({
    tenantId: input.tenantId,
    conversationId: input.conversationId,
    direction: "outbound",
    providerMessageId: sent.providerMessageId,
    fromPhone: sent.fromNumber || input.fromNumber,
    toPhone: input.to,
    body: input.body,
    status: sent.status,
    metadata: "{}"
  });
  return sent;
}

const workers = new TenantWorkerManager();
const webSessions = new WhatsAppWebSessionManager();

export function registerWhatsAppRoutes(input: {
  app: Express;
  requireScope: RequireScope;
  sendJson: SendJson;
}): void {
  const { app, requireScope, sendJson } = input;
  const cfg = getConfig();
  workers.syncTenants(listWhatsAppTenants());
  webSessions.setInboundHandler(async (event) => {
    try {
      const result = await processInboundWhatsAppMessage(event, workers, async ({ tenant, to, body, conversationId }) => {
        if (tenant.provider === "whatsapp_web") {
          return sendViaWebSession({
            tenantId: tenant.id,
            fromNumber: tenant.whatsappNumber,
            to,
            body,
            conversationId
          });
        }
        throw new Error("Inbound event received for non-web tenant on web session manager");
      });
      if (!result.applied && result.ignoredReason) {
        logger.warn("whatsapp.web.inbound_ignored", {
          tenantId: result.tenantId,
          reason: result.ignoredReason
        });
      }
    } catch (error) {
      logger.error("whatsapp.web.inbound_processing_failed", {
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });
  for (const tenant of listWhatsAppTenants()) {
    if (tenant.provider === "whatsapp_web" && tenant.status === "connected") {
      void webSessions.start(tenant.id).catch((error: unknown) => {
        logger.error("whatsapp.web.autostart_failed", {
          tenantId: tenant.id,
          message: error instanceof Error ? error.message : String(error)
        });
      });
    }
  }

  app.get("/api/wa/tenants", (req, res) => {
    if (!requireScope(req, res, "read")) return;
    const tenants = listWhatsAppTenants();
    workers.syncTenants(tenants);
    const workerMap = new Map(workers.list().map((state) => [state.tenantId, state]));
    sendJson(res, 200, {
      ok: true,
      data: tenants.map((tenant) => ({
        ...mapPublicTenant(tenant),
        worker: workerMap.get(tenant.id) ?? null,
        webSession: tenant.provider === "whatsapp_web" ? webSessions.getState(tenant.id) : undefined
      }))
    });
  });

  app.get("/api/wa/tenants/:id", (req, res) => {
    if (!requireScope(req, res, "read")) return;
    const tenant = getWhatsAppTenantById(req.params.id);
    if (!tenant) {
      sendJson(res, 404, appError("NOT_FOUND", "Tenant not found"));
      return;
    }
    workers.syncTenants(listWhatsAppTenants());
    sendJson(res, 200, {
      ok: true,
      data: {
        ...mapPublicTenant(tenant),
        worker: workers.get(tenant.id),
        webSession: tenant.provider === "whatsapp_web" ? webSessions.getState(tenant.id) : undefined
      }
    });
  });

  app.post("/api/wa/tenants", (req, res) => {
    if (!requireScope(req, res, "admin")) return;
    const body = asObject(req.body);
    if (!body) {
      sendJson(res, 400, appError("VALIDATION_ERROR", "Request body must be a JSON object"));
      return;
    }

    const displayName = requireString(body, "displayName");
    const providerRaw = requireString(body, "provider") ?? "whatsapp_web";
    const provider = providerRaw === "twilio" || providerRaw === "whatsapp_web" ? providerRaw : null;
    const whatsappNumberRaw = requireString(body, "whatsappNumber");
    const twilioAccountSid = requireString(body, "twilioAccountSid");
    const twilioAuthToken = requireString(body, "twilioAuthToken");
    const anthropicApiKey = requireString(body, "anthropicApiKey");
    if (!provider) {
      sendJson(res, 422, appError("VALIDATION_ERROR", "provider must be twilio or whatsapp_web"));
      return;
    }
    if (!displayName || !whatsappNumberRaw || !anthropicApiKey) {
      sendJson(
        res,
        422,
        appError(
          "VALIDATION_ERROR",
          "displayName, provider, whatsappNumber, and anthropicApiKey are required"
        )
      );
      return;
    }
    if (provider === "twilio" && (!twilioAccountSid || !twilioAuthToken)) {
      sendJson(
        res,
        422,
        appError("VALIDATION_ERROR", "twilioAccountSid and twilioAuthToken are required when provider=twilio")
      );
      return;
    }

    const whatsappNumber = normalizeWhatsAppNumber(whatsappNumberRaw);
    if (!whatsappNumber) {
      sendJson(res, 422, appError("VALIDATION_ERROR", "whatsappNumber must be a valid international number"));
      return;
    }

    const twilioFromNumberRaw = requireString(body, "twilioFromNumber");
    const twilioFromNumber = normalizeWhatsAppNumber(twilioFromNumberRaw ?? whatsappNumberRaw);
    if (!twilioFromNumber) {
      sendJson(res, 422, appError("VALIDATION_ERROR", "twilioFromNumber must be a valid international number"));
      return;
    }

    const specialtyRaw = requireString(body, "defaultSpecialtyId");
    const defaultSpecialtyId = specialtyRaw ? normalizeSpecialtyId(specialtyRaw) : "family_medicine";
    if (!defaultSpecialtyId) {
      sendJson(res, 422, appError("VALIDATION_ERROR", getSpecialtyValidationMessage()));
      return;
    }

    const workflowRaw = requireString(body, "defaultWorkflow");
    const defaultWorkflow = workflowRaw ? parseWorkflow(workflowRaw) : "triage_intake";
    if (!defaultWorkflow) {
      sendJson(res, 422, appError("VALIDATION_ERROR", getWorkflowValidationMessage()));
      return;
    }

    const languageRaw = requireString(body, "defaultLanguage");
    const defaultLanguage = languageRaw ? parseLanguage(languageRaw) : "en";
    if (!defaultLanguage) {
      sendJson(res, 422, appError("VALIDATION_ERROR", "defaultLanguage must be one of en|hi"));
      return;
    }

    const aiModel = requireString(body, "aiModel") ?? cfg.aiModel;
    const explicitDoctorId = requireString(body, "defaultDoctorId");
    let defaultDoctorId = explicitDoctorId;
    if (defaultDoctorId && !getDoctorById(defaultDoctorId)) {
      sendJson(res, 404, appError("NOT_FOUND", "defaultDoctorId not found"));
      return;
    }
    if (!defaultDoctorId) {
      const doctorName = requireString(body, "doctorName") ?? `${displayName} Virtual Care`;
      defaultDoctorId = addDoctor({
        name: doctorName,
        specialty: defaultSpecialtyId
      }).id;
    }

    try {
      const tenant = addWhatsAppTenant({
        displayName,
        provider,
        whatsappNumber,
        twilioAccountSid: twilioAccountSid ?? "",
        twilioAuthTokenEnc: twilioAuthToken ? encryptSecret(twilioAuthToken) : "",
        twilioFromNumber: provider === "twilio" ? twilioFromNumber : whatsappNumber,
        anthropicApiKeyEnc: encryptSecret(anthropicApiKey),
        aiModel,
        defaultSpecialtyId,
        defaultWorkflow,
        defaultLanguage,
        defaultDoctorId,
        status: provider === "whatsapp_web" ? "disconnected" : "connected"
      });
      const state =
        provider === "whatsapp_web"
          ? workers.disconnect({ ...tenant, status: "disconnected" })
          : workers.connect(tenant);
      sendJson(res, 201, {
        ok: true,
        data: {
          ...mapPublicTenant(tenant),
          worker: state
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("UNIQUE constraint failed")) {
        sendJson(res, 409, appError("CONFLICT", "A tenant with this WhatsApp number already exists"));
        return;
      }
      sendJson(res, 500, toStructuredError(error));
    }
  });

  app.post("/api/wa/tenants/:id/connect", async (req, res) => {
    if (!requireScope(req, res, "admin")) return;
    const tenantWithSecrets = getWhatsAppTenantWithSecretsById(req.params.id);
    if (!tenantWithSecrets) {
      sendJson(res, 404, appError("NOT_FOUND", "Tenant not found"));
      return;
    }
    const body = asObject(req.body) ?? {};
    const twilioAccountSid = requireString(body, "twilioAccountSid") ?? undefined;
    const twilioAuthToken = requireString(body, "twilioAuthToken") ?? undefined;
    const twilioFromNumberRaw = requireString(body, "twilioFromNumber") ?? undefined;
    const anthropicApiKey = requireString(body, "anthropicApiKey") ?? undefined;
    const aiModel = requireString(body, "aiModel") ?? undefined;
    const twilioFromNumber = twilioFromNumberRaw ? normalizeWhatsAppNumber(twilioFromNumberRaw) ?? undefined : undefined;
    if (twilioFromNumberRaw && !twilioFromNumber) {
      sendJson(res, 422, appError("VALIDATION_ERROR", "twilioFromNumber must be a valid international number"));
      return;
    }

    const updatedCredentials = updateWhatsAppTenantCredentials({
      tenantId: tenantWithSecrets.id,
      twilioAccountSid,
      twilioAuthTokenEnc: twilioAuthToken ? encryptSecret(twilioAuthToken) : undefined,
      twilioFromNumber,
      anthropicApiKeyEnc: anthropicApiKey ? encryptSecret(anthropicApiKey) : undefined,
      aiModel
    });
    if (!updatedCredentials) {
      sendJson(res, 404, appError("NOT_FOUND", "Tenant not found"));
      return;
    }

    if (tenantWithSecrets.provider === "whatsapp_web") {
      let sessionState;
      try {
        sessionState = await webSessions.start(tenantWithSecrets.id);
      } catch (error) {
        logger.error("whatsapp.web.start_failed", {
          tenantId: tenantWithSecrets.id,
          message: error instanceof Error ? error.message : String(error)
        });
        sendJson(res, 500, toStructuredError(error));
        return;
      }
      const connected = updateWhatsAppTenantStatus(tenantWithSecrets.id, "connected");
      if (!connected) {
        sendJson(res, 404, appError("NOT_FOUND", "Tenant not found"));
        return;
      }
      const worker = workers.connect(connected);
      sendJson(res, 200, {
        ok: true,
        data: {
          ...mapPublicTenant(connected),
          worker,
          webSession: sessionState
        }
      });
      return;
    }

    const connected = updateWhatsAppTenantStatus(tenantWithSecrets.id, "connected");
    if (!connected) {
      sendJson(res, 404, appError("NOT_FOUND", "Tenant not found"));
      return;
    }
    const state = workers.connect(connected);
    sendJson(res, 200, {
      ok: true,
      data: {
        ...mapPublicTenant(connected),
        worker: state
      }
    });
  });

  app.post("/api/wa/tenants/:id/disconnect", async (req, res) => {
    if (!requireScope(req, res, "admin")) return;
    const tenantBefore = getWhatsAppTenantById(req.params.id);
    if (!tenantBefore) {
      sendJson(res, 404, appError("NOT_FOUND", "Tenant not found"));
      return;
    }
    if (tenantBefore.provider === "whatsapp_web") {
      await webSessions.stop(tenantBefore.id);
    }
    const tenant = updateWhatsAppTenantStatus(req.params.id, "disconnected");
    if (!tenant) {
      sendJson(res, 404, appError("NOT_FOUND", "Tenant not found"));
      return;
    }
    const state = workers.disconnect(tenant);
    sendJson(res, 200, {
      ok: true,
      data: {
        ...mapPublicTenant(tenant),
        worker: state,
        webSession: tenant.provider === "whatsapp_web" ? webSessions.getState(tenant.id) : undefined
      }
    });
  });

  app.get("/api/wa/workers", (req, res) => {
    if (!requireScope(req, res, "read")) return;
    workers.syncTenants(listWhatsAppTenants());
    sendJson(res, 200, {
      ok: true,
      data: workers.list()
    });
  });

  app.get("/api/wa/tenants/:id/web-session", (req, res) => {
    if (!requireScope(req, res, "read")) return;
    const tenant = getWhatsAppTenantById(req.params.id);
    if (!tenant) {
      sendJson(res, 404, appError("NOT_FOUND", "Tenant not found"));
      return;
    }
    if (tenant.provider !== "whatsapp_web") {
      sendJson(res, 422, appError("VALIDATION_ERROR", "Tenant provider is not whatsapp_web"));
      return;
    }
    sendJson(res, 200, {
      ok: true,
      data: {
        tenantId: tenant.id,
        status: tenant.status,
        session: webSessions.getState(tenant.id)
      }
    });
  });

  app.post("/api/wa/tenants/:id/web-session/start", async (req, res) => {
    if (!requireScope(req, res, "admin")) return;
    const tenant = getWhatsAppTenantById(req.params.id);
    if (!tenant) {
      sendJson(res, 404, appError("NOT_FOUND", "Tenant not found"));
      return;
    }
    if (tenant.provider !== "whatsapp_web") {
      sendJson(res, 422, appError("VALIDATION_ERROR", "Tenant provider is not whatsapp_web"));
      return;
    }
    try {
      const session = await webSessions.start(tenant.id);
      const connected = updateWhatsAppTenantStatus(tenant.id, "connected");
      const nextTenant = connected ?? tenant;
      const worker = workers.connect(nextTenant);
      sendJson(res, 200, {
        ok: true,
        data: {
          ...mapPublicTenant(nextTenant),
          worker,
          webSession: session
        }
      });
    } catch (error) {
      sendJson(res, 500, toStructuredError(error));
    }
  });

  app.post("/webhooks/whatsapp/twilio/inbound", async (req, res) => {
    try {
      const contentType = req.header("content-type") ?? "";
      if (!contentType.toLowerCase().includes("application/x-www-form-urlencoded")) {
        sendJson(res, 415, appError("VALIDATION_ERROR", "Content-Type must be application/x-www-form-urlencoded"));
        return;
      }

      const rawBody = await readRequestBodyWithLimit(req, {
        maxBytes: cfg.twilioWebhookMaxBodyBytes,
        timeoutMs: cfg.twilioWebhookBodyTimeoutMs
      });
      const formBody = parseUrlEncodedFormBody(rawBody);
      const payload = validateWebhookPayload(formBody);
      if (!payload) {
        sendJson(res, 422, appError("VALIDATION_ERROR", "MessageSid, Body, From, and To are required"));
        return;
      }
      const candidate = getWhatsAppTenantWithSecretsByNumber(payload.To);
      if (!candidate) {
        sendJson(res, 404, appError("NOT_FOUND", "Tenant not found for destination number"));
        return;
      }
      if (candidate.provider !== "twilio") {
        sendJson(res, 422, appError("VALIDATION_ERROR", "Destination tenant is not configured for Twilio webhook transport"));
        return;
      }

      if (cfg.twilioWebhookValidate) {
        if (!candidate.twilioAuthToken) {
          sendJson(res, 422, appError("VALIDATION_ERROR", "Twilio auth token is missing for destination tenant"));
          return;
        }
        const signature = req.header("x-twilio-signature");
        if (!signature) {
          sendJson(res, 403, appError("FORBIDDEN", "Missing Twilio signature"));
          return;
        }
        const host = req.header("host");
        const protocol = req.header("x-forwarded-proto") ?? req.protocol;
        const callbackUrl = cfg.publicBaseUrl
          ? `${cfg.publicBaseUrl.replace(/\/$/, "")}${req.originalUrl}`
          : `${protocol}://${host}${req.originalUrl}`;
        const token = decryptSecret(candidate.twilioAuthToken);
        const valid = twilio.validateRequest(token, signature, callbackUrl, formBody);
        if (!valid) {
          sendJson(res, 403, appError("FORBIDDEN", "Invalid Twilio signature"));
          return;
        }
      }

      const processed = await processTwilioInboundWhatsApp(payload, workers);
      if (!processed.tenantId && processed.ignoredReason === "tenant_not_found") {
        sendJson(res, 404, appError("NOT_FOUND", "Tenant not found for destination number"));
        return;
      }
      if (!processed.applied) {
        sendJson(res, 200, {
          ok: true,
          data: processed,
          meta: {
            deduped: processed.deduped,
            applied: false,
            ignoredReason: processed.ignoredReason
          }
        });
        return;
      }

      sendJson(res, 200, {
        ok: true,
        data: processed
      });
    } catch (error) {
      if (isRequestBodyLimitError(error)) {
        const status =
          error.code === "PAYLOAD_TOO_LARGE"
            ? 413
            : error.code === "REQUEST_BODY_TIMEOUT"
              ? 408
              : 400;
        sendJson(res, status, appError("VALIDATION_ERROR", requestBodyErrorToText(error.code)));
        return;
      }
      logger.error("whatsapp.inbound.webhook_failed", {
        message: error instanceof Error ? error.message : String(error)
      });
      sendJson(res, 500, toStructuredError(error));
    }
  });
}
