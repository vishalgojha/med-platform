import fs from "node:fs";
import path from "node:path";
import {
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  makeWASocket,
  useMultiFileAuthState
} from "@whiskeysockets/baileys";
import { getConfig } from "../config.js";
import { logger } from "../logger.js";
import { makeId, nowIso } from "../utils.js";
import { normalizeWhatsAppIdentity, toWhatsAppJid } from "./store.js";

interface WebSessionRuntime {
  tenantId: string;
  running: boolean;
  connected: boolean;
  linked: boolean;
  qrCode?: string;
  selfJid?: string;
  lastError?: string;
  startedAt?: string;
  updatedAt: string;
  shouldRun: boolean;
  reconnectTimer?: NodeJS.Timeout;
  socket?: ReturnType<typeof makeWASocket>;
}

export interface WhatsAppWebInboundEvent {
  tenantId: string;
  messageSid: string;
  from: string;
  to: string;
  body: string;
  profileName?: string;
}

export interface WhatsAppWebSessionState {
  tenantId: string;
  running: boolean;
  connected: boolean;
  linked: boolean;
  qrCode?: string;
  selfJid?: string;
  lastError?: string;
  startedAt?: string;
  updatedAt: string;
}

export interface WhatsAppWebSendResult {
  providerMessageId: string;
  fromNumber: string;
  status: "sent" | "dry_run_sent";
}

function runtimeToState(runtime: WebSessionRuntime): WhatsAppWebSessionState {
  return {
    tenantId: runtime.tenantId,
    running: runtime.running,
    connected: runtime.connected,
    linked: runtime.linked,
    qrCode: runtime.qrCode,
    selfJid: runtime.selfJid,
    lastError: runtime.lastError,
    startedAt: runtime.startedAt,
    updatedAt: runtime.updatedAt
  };
}

function resolveAuthRoot(): string {
  const cfg = getConfig();
  const dbPath = path.resolve(cfg.dbPath);
  return path.join(path.dirname(dbPath), "wa-auth");
}

function extractMessageBody(message: unknown): string {
  const payload = message as
    | {
        conversation?: string;
        extendedTextMessage?: { text?: string };
        imageMessage?: { caption?: string };
        videoMessage?: { caption?: string };
        documentMessage?: { caption?: string };
      }
    | undefined;
  return (
    payload?.conversation ??
    payload?.extendedTextMessage?.text ??
    payload?.imageMessage?.caption ??
    payload?.videoMessage?.caption ??
    payload?.documentMessage?.caption ??
    ""
  ).trim();
}

export class WhatsAppWebSessionManager {
  private readonly runtimes = new Map<string, WebSessionRuntime>();
  private inboundHandler: ((event: WhatsAppWebInboundEvent) => Promise<void> | void) | null = null;

  setInboundHandler(handler: (event: WhatsAppWebInboundEvent) => Promise<void> | void): void {
    this.inboundHandler = handler;
  }

  private ensureRuntime(tenantId: string): WebSessionRuntime {
    const current = this.runtimes.get(tenantId);
    if (current) return current;
    const runtime: WebSessionRuntime = {
      tenantId,
      running: false,
      connected: false,
      linked: false,
      updatedAt: nowIso(),
      shouldRun: false
    };
    this.runtimes.set(tenantId, runtime);
    return runtime;
  }

  private authDirForTenant(tenantId: string): string {
    return path.join(resolveAuthRoot(), tenantId);
  }

  async start(tenantId: string): Promise<WhatsAppWebSessionState> {
    const runtime = this.ensureRuntime(tenantId);
    runtime.shouldRun = true;
    runtime.running = true;
    runtime.updatedAt = nowIso();
    if (!runtime.startedAt) {
      runtime.startedAt = runtime.updatedAt;
    }
    if (runtime.socket && runtime.connected) {
      return runtimeToState(runtime);
    }
    if (runtime.reconnectTimer) {
      clearTimeout(runtime.reconnectTimer);
      runtime.reconnectTimer = undefined;
    }

    const authDir = this.authDirForTenant(tenantId);
    fs.mkdirSync(authDir, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    const { version } = await fetchLatestBaileysVersion();
    const sock = makeWASocket({
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, {} as never)
      },
      version,
      logger: undefined as never,
      printQRInTerminal: false,
      syncFullHistory: false,
      markOnlineOnConnect: false
    });
    runtime.socket = sock;
    runtime.linked = Boolean(sock.user?.id);
    runtime.selfJid = sock.user?.id;
    runtime.lastError = undefined;
    runtime.updatedAt = nowIso();

    sock.ev.on("creds.update", () => {
      void Promise.resolve(saveCreds())
        .then(() => {
          runtime.linked = true;
          runtime.updatedAt = nowIso();
        })
        .catch((error: unknown) => {
          runtime.lastError = error instanceof Error ? error.message : String(error);
          runtime.updatedAt = nowIso();
        });
    });

    sock.ev.on("connection.update", (update: Partial<{ connection: string; qr?: string; lastDisconnect?: { error?: unknown } }>) => {
      if (update.qr) {
        runtime.qrCode = update.qr;
        runtime.linked = false;
        runtime.updatedAt = nowIso();
      }
      if (update.connection === "open") {
        runtime.connected = true;
        runtime.linked = true;
        runtime.qrCode = undefined;
        runtime.selfJid = sock.user?.id;
        runtime.lastError = undefined;
        runtime.updatedAt = nowIso();
      }
      if (update.connection === "close") {
        runtime.connected = false;
        runtime.updatedAt = nowIso();
        const statusCode =
          (update.lastDisconnect?.error as { output?: { statusCode?: number } } | undefined)?.output?.statusCode ??
          (update.lastDisconnect?.error as { status?: number } | undefined)?.status;
        const reasonMessage =
          update.lastDisconnect?.error instanceof Error
            ? update.lastDisconnect.error.message
            : statusCode
              ? `connection closed (${statusCode})`
              : "connection closed";
        runtime.lastError = reasonMessage;
        const loggedOut = statusCode === DisconnectReason.loggedOut;
        if (loggedOut) {
          runtime.linked = false;
          runtime.shouldRun = false;
          runtime.running = false;
          runtime.socket = undefined;
          return;
        }
        if (runtime.shouldRun) {
          runtime.reconnectTimer = setTimeout(() => {
            void this.start(tenantId).catch((error: unknown) => {
              runtime.lastError = error instanceof Error ? error.message : String(error);
              runtime.updatedAt = nowIso();
            });
          }, 2_000);
        }
      }
    });

    sock.ev.on("messages.upsert", (event: unknown) => {
      const typed = event as { type?: string; messages?: unknown[] };
      if (typed.type !== "notify" || !Array.isArray(typed.messages) || !this.inboundHandler) {
        return;
      }
      for (const item of typed.messages) {
        const message = item as { key?: unknown; message?: unknown };
        const key = message.key as
          | { id?: string; fromMe?: boolean; remoteJid?: string; participant?: string }
          | undefined;
        if (!key || key.fromMe) {
          continue;
        }
        const body = extractMessageBody(message.message);
        if (!body) {
          continue;
        }
        const remoteJid = key.remoteJid ?? "";
        if (!remoteJid || remoteJid === "status@broadcast" || remoteJid.endsWith("@broadcast")) {
          continue;
        }
        const fromSource = remoteJid.endsWith("@g.us") ? key.participant ?? "" : remoteJid;
        const from = normalizeWhatsAppIdentity(fromSource);
        const to = normalizeWhatsAppIdentity(runtime.selfJid ?? sock.user?.id ?? "");
        if (!from || !to) {
          continue;
        }
        const messageSid = key.id?.trim() || makeId("wa_inbound");
        void Promise.resolve(
          this.inboundHandler({
            tenantId,
            messageSid,
            from,
            to,
            body
          })
        ).catch((error: unknown) => {
          runtime.lastError = error instanceof Error ? error.message : String(error);
          runtime.updatedAt = nowIso();
          logger.error("whatsapp.web.inbound_handler_failed", {
            tenantId,
            message: runtime.lastError
          });
        });
      }
    });

    return runtimeToState(runtime);
  }

  async stop(tenantId: string): Promise<WhatsAppWebSessionState> {
    const runtime = this.ensureRuntime(tenantId);
    runtime.shouldRun = false;
    runtime.running = false;
    runtime.connected = false;
    runtime.qrCode = undefined;
    runtime.updatedAt = nowIso();
    if (runtime.reconnectTimer) {
      clearTimeout(runtime.reconnectTimer);
      runtime.reconnectTimer = undefined;
    }
    if (runtime.socket) {
      try {
        runtime.socket.end(new Error("session stopped"));
      } catch {
        // no-op
      }
      runtime.socket = undefined;
    }
    return runtimeToState(runtime);
  }

  getState(tenantId: string): WhatsAppWebSessionState | null {
    const runtime = this.runtimes.get(tenantId);
    return runtime ? runtimeToState(runtime) : null;
  }

  listStates(): WhatsAppWebSessionState[] {
    return Array.from(this.runtimes.values())
      .map(runtimeToState)
      .sort((a, b) => a.tenantId.localeCompare(b.tenantId));
  }

  async sendText(tenantId: string, toNumber: string, body: string): Promise<WhatsAppWebSendResult> {
    const runtime = this.runtimes.get(tenantId);
    if (!runtime?.socket || !runtime.connected) {
      throw new Error("WhatsApp Web session is not connected");
    }
    const cfg = getConfig();
    const fromNumber = normalizeWhatsAppIdentity(runtime.selfJid ?? "") ?? "";
    if (cfg.dryRun || cfg.agenticWhatsappDryRun) {
      return {
        providerMessageId: makeId("wa_out"),
        fromNumber,
        status: "dry_run_sent"
      };
    }

    const jid = toWhatsAppJid(toNumber);
    if (!jid) {
      throw new Error("Invalid WhatsApp destination number");
    }
    const result = await runtime.socket.sendMessage(jid, {
      text: body
    });
    runtime.updatedAt = nowIso();
    return {
      providerMessageId: result?.key?.id ?? makeId("wa_out"),
      fromNumber,
      status: "sent"
    };
  }
}
