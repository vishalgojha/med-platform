import type { SupportedLanguage } from "@med-platform/clinical-specialties";
import { getDb } from "../db/client.js";
import { makeId, nowIso } from "../utils.js";
import type { OrchestrationWorkflow } from "../orchestration/router.js";
import type {
  WhatsAppConversation,
  WhatsAppMessageDirection,
  WhatsAppMessageEvent,
  WhatsAppProvider,
  WhatsAppTenant,
  WhatsAppTenantSecrets,
  WhatsAppTenantStatus,
  WhatsAppTenantWithSecrets
} from "./types.js";

interface WhatsAppTenantRow {
  id: string;
  display_name: string;
  status: WhatsAppTenantStatus;
  provider: WhatsAppProvider;
  whatsapp_number: string;
  twilio_account_sid: string;
  twilio_auth_token_enc: string;
  twilio_from_number: string;
  anthropic_api_key_enc: string;
  ai_model: string;
  default_specialty_id: string;
  default_workflow: OrchestrationWorkflow;
  default_language: SupportedLanguage;
  default_doctor_id: string | null;
  created_at: string;
  updated_at: string;
}

interface WhatsAppConversationRow {
  id: string;
  tenant_id: string;
  user_phone: string;
  patient_id: string;
  doctor_id: string;
  specialty_id: string;
  language: SupportedLanguage;
  last_inbound_message_sid: string | null;
  created_at: string;
  updated_at: string;
}

interface WhatsAppMessageEventRow {
  id: string;
  tenant_id: string;
  conversation_id: string | null;
  direction: WhatsAppMessageDirection;
  provider_message_id: string;
  from_phone: string;
  to_phone: string;
  body: string;
  status: string;
  metadata: string;
  created_at: string;
}

function mapTenant(row: WhatsAppTenantRow): WhatsAppTenant {
  return {
    id: row.id,
    displayName: row.display_name,
    status: row.status,
    provider: row.provider,
    whatsappNumber: row.whatsapp_number,
    twilioAccountSid: row.twilio_account_sid,
    twilioFromNumber: row.twilio_from_number,
    aiModel: row.ai_model,
    defaultSpecialtyId: row.default_specialty_id,
    defaultWorkflow: row.default_workflow,
    defaultLanguage: row.default_language,
    defaultDoctorId: row.default_doctor_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapConversation(row: WhatsAppConversationRow): WhatsAppConversation {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    userPhone: row.user_phone,
    patientId: row.patient_id,
    doctorId: row.doctor_id,
    specialtyId: row.specialty_id,
    language: row.language,
    lastInboundMessageSid: row.last_inbound_message_sid ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapMessageEvent(row: WhatsAppMessageEventRow): WhatsAppMessageEvent {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    conversationId: row.conversation_id ?? undefined,
    direction: row.direction,
    providerMessageId: row.provider_message_id,
    fromPhone: row.from_phone,
    toPhone: row.to_phone,
    body: row.body,
    status: row.status,
    metadata: row.metadata,
    createdAt: row.created_at
  };
}

export function normalizeWhatsAppNumber(input: string): string | null {
  const cleaned = input
    .trim()
    .replace(/^whatsapp:/i, "")
    .replace(/\s+/g, "")
    .replace(/[^+\d]/g, "");
  if (!cleaned) return null;
  const withPlus = cleaned.startsWith("00")
    ? `+${cleaned.slice(2)}`
    : cleaned.startsWith("+")
      ? cleaned
      : `+${cleaned}`;
  if (!/^\+\d{8,15}$/.test(withPlus)) {
    return null;
  }
  return withPlus;
}

export function normalizeWhatsAppIdentity(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  if (raw.includes("@")) {
    const [local] = raw.split("@");
    const digits = local.replace(/[^0-9]/g, "");
    if (!digits) return null;
    return normalizeWhatsAppNumber(`+${digits}`);
  }
  return normalizeWhatsAppNumber(raw);
}

export function toWhatsAppJid(number: string): string | null {
  const normalized = normalizeWhatsAppNumber(number);
  if (!normalized) return null;
  return `${normalized.slice(1)}@s.whatsapp.net`;
}

export function addWhatsAppTenant(input: {
  displayName: string;
  provider: WhatsAppProvider;
  whatsappNumber: string;
  twilioAccountSid?: string;
  twilioAuthTokenEnc?: string;
  twilioFromNumber?: string;
  anthropicApiKeyEnc: string;
  aiModel: string;
  defaultSpecialtyId: string;
  defaultWorkflow: OrchestrationWorkflow;
  defaultLanguage: SupportedLanguage;
  defaultDoctorId?: string;
  status?: WhatsAppTenantStatus;
}): WhatsAppTenant {
  const db = getDb();
  const now = nowIso();
  const id = makeId("wat");
  db.prepare(
    `INSERT INTO wa_tenants (
      id,
      display_name,
      status,
      provider,
      whatsapp_number,
      twilio_account_sid,
      twilio_auth_token_enc,
      twilio_from_number,
      anthropic_api_key_enc,
      ai_model,
      default_specialty_id,
      default_workflow,
      default_language,
      default_doctor_id,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.displayName,
    input.status ?? "connected",
    input.provider,
    input.whatsappNumber,
    input.twilioAccountSid ?? "",
    input.twilioAuthTokenEnc ?? "",
    input.twilioFromNumber ?? input.whatsappNumber,
    input.anthropicApiKeyEnc,
    input.aiModel,
    input.defaultSpecialtyId,
    input.defaultWorkflow,
    input.defaultLanguage,
    input.defaultDoctorId ?? null,
    now,
    now
  );
  const tenant = getWhatsAppTenantById(id);
  if (!tenant) {
    throw new Error("Failed to read tenant after insert");
  }
  return tenant;
}

export function listWhatsAppTenants(): WhatsAppTenant[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM wa_tenants ORDER BY created_at DESC").all() as WhatsAppTenantRow[];
  return rows.map(mapTenant);
}

export function getWhatsAppTenantById(id: string): WhatsAppTenant | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM wa_tenants WHERE id = ?").get(id) as WhatsAppTenantRow | undefined;
  return row ? mapTenant(row) : null;
}

export function getWhatsAppTenantSecrets(tenantId: string): WhatsAppTenantSecrets | null {
  const db = getDb();
  const row = db
    .prepare("SELECT twilio_auth_token_enc, anthropic_api_key_enc FROM wa_tenants WHERE id = ?")
    .get(tenantId) as { twilio_auth_token_enc: string; anthropic_api_key_enc: string } | undefined;
  if (!row) return null;
  return {
    twilioAuthToken: row.twilio_auth_token_enc || undefined,
    anthropicApiKey: row.anthropic_api_key_enc
  };
}

export function getWhatsAppTenantWithSecretsById(tenantId: string): WhatsAppTenantWithSecrets | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM wa_tenants WHERE id = ?").get(tenantId) as WhatsAppTenantRow | undefined;
  if (!row) return null;
  return {
    ...mapTenant(row),
    twilioAuthToken: row.twilio_auth_token_enc || undefined,
    anthropicApiKey: row.anthropic_api_key_enc
  };
}

export function getWhatsAppTenantWithSecretsByNumber(number: string): WhatsAppTenantWithSecrets | null {
  const normalized = normalizeWhatsAppNumber(number);
  if (!normalized) {
    return null;
  }
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM wa_tenants WHERE whatsapp_number = ? OR twilio_from_number = ?")
    .get(normalized, normalized) as WhatsAppTenantRow | undefined;
  if (!row) return null;
  return {
    ...mapTenant(row),
    twilioAuthToken: row.twilio_auth_token_enc || undefined,
    anthropicApiKey: row.anthropic_api_key_enc
  };
}

export function updateWhatsAppTenantStatus(tenantId: string, status: WhatsAppTenantStatus): WhatsAppTenant | null {
  const db = getDb();
  const updatedAt = nowIso();
  db.prepare("UPDATE wa_tenants SET status = ?, updated_at = ? WHERE id = ?").run(status, updatedAt, tenantId);
  return getWhatsAppTenantById(tenantId);
}

export function updateWhatsAppTenantCredentials(input: {
  tenantId: string;
  twilioAccountSid?: string;
  twilioAuthTokenEnc?: string;
  twilioFromNumber?: string;
  anthropicApiKeyEnc?: string;
  aiModel?: string;
}): WhatsAppTenant | null {
  const current = getWhatsAppTenantWithSecretsById(input.tenantId);
  if (!current) return null;
  const db = getDb();
  db.prepare(
    `UPDATE wa_tenants
     SET twilio_account_sid = ?,
         twilio_auth_token_enc = ?,
         twilio_from_number = ?,
         anthropic_api_key_enc = ?,
         ai_model = ?,
         updated_at = ?
     WHERE id = ?`
  ).run(
    input.twilioAccountSid ?? current.twilioAccountSid,
    input.twilioAuthTokenEnc ?? current.twilioAuthToken ?? "",
    input.twilioFromNumber ?? current.twilioFromNumber,
    input.anthropicApiKeyEnc ?? current.anthropicApiKey,
    input.aiModel ?? current.aiModel,
    nowIso(),
    input.tenantId
  );
  return getWhatsAppTenantById(input.tenantId);
}

export function getWhatsAppConversationByTenantAndUser(tenantId: string, userPhone: string): WhatsAppConversation | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM wa_conversations WHERE tenant_id = ? AND user_phone = ?")
    .get(tenantId, userPhone) as WhatsAppConversationRow | undefined;
  return row ? mapConversation(row) : null;
}

export function upsertWhatsAppConversation(input: {
  tenantId: string;
  userPhone: string;
  patientId: string;
  doctorId: string;
  specialtyId: string;
  language: SupportedLanguage;
  lastInboundMessageSid?: string;
}): WhatsAppConversation {
  const db = getDb();
  const existing = getWhatsAppConversationByTenantAndUser(input.tenantId, input.userPhone);
  const updatedAt = nowIso();

  if (!existing) {
    const createdAt = updatedAt;
    const id = makeId("wac");
    db.prepare(
      `INSERT INTO wa_conversations (
        id,
        tenant_id,
        user_phone,
        patient_id,
        doctor_id,
        specialty_id,
        language,
        last_inbound_message_sid,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      input.tenantId,
      input.userPhone,
      input.patientId,
      input.doctorId,
      input.specialtyId,
      input.language,
      input.lastInboundMessageSid ?? null,
      createdAt,
      updatedAt
    );
    const row = getWhatsAppConversationByTenantAndUser(input.tenantId, input.userPhone);
    if (!row) {
      throw new Error("Failed to load conversation after insert");
    }
    return row;
  }

  db.prepare(
    `UPDATE wa_conversations
     SET patient_id = ?,
         doctor_id = ?,
         specialty_id = ?,
         language = ?,
         last_inbound_message_sid = COALESCE(?, last_inbound_message_sid),
         updated_at = ?
     WHERE id = ?`
  ).run(
    input.patientId,
    input.doctorId,
    input.specialtyId,
    input.language,
    input.lastInboundMessageSid ?? null,
    updatedAt,
    existing.id
  );

  const row = getWhatsAppConversationByTenantAndUser(input.tenantId, input.userPhone);
  if (!row) {
    throw new Error("Failed to load conversation after update");
  }
  return row;
}

export function recordWhatsAppMessageEvent(input: {
  tenantId: string;
  conversationId?: string;
  direction: WhatsAppMessageDirection;
  providerMessageId: string;
  fromPhone: string;
  toPhone: string;
  body: string;
  status: string;
  metadata: string;
}): { accepted: boolean; event: WhatsAppMessageEvent } {
  const db = getDb();
  const id = makeId("wam");
  const createdAt = nowIso();
  const info = db
    .prepare(
      `INSERT OR IGNORE INTO wa_message_events (
        id,
        tenant_id,
        conversation_id,
        direction,
        provider_message_id,
        from_phone,
        to_phone,
        body,
        status,
        metadata,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id,
      input.tenantId,
      input.conversationId ?? null,
      input.direction,
      input.providerMessageId,
      input.fromPhone,
      input.toPhone,
      input.body,
      input.status,
      input.metadata,
      createdAt
    );

  const row = db
    .prepare(
      `SELECT * FROM wa_message_events
       WHERE tenant_id = ? AND direction = ? AND provider_message_id = ?`
    )
    .get(input.tenantId, input.direction, input.providerMessageId) as WhatsAppMessageEventRow | undefined;
  if (!row) {
    throw new Error("Failed to load message event");
  }
  return { accepted: info.changes > 0, event: mapMessageEvent(row) };
}
