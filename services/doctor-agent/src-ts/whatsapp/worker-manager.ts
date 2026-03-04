import { nowIso } from "../utils.js";
import type { WhatsAppTenant, WhatsAppTenantStatus } from "./types.js";

export interface TenantWorkerState {
  tenantId: string;
  tenantName: string;
  status: WhatsAppTenantStatus;
  running: boolean;
  lastStartedAt?: string;
  lastStoppedAt?: string;
  lastInboundAt?: string;
  lastOutboundAt?: string;
  processedInbound: number;
  processedOutbound: number;
  lastError?: string;
}

export class TenantWorkerManager {
  private readonly states = new Map<string, TenantWorkerState>();

  syncTenants(tenants: WhatsAppTenant[]): void {
    const currentIds = new Set<string>();
    for (const tenant of tenants) {
      currentIds.add(tenant.id);
      const existing = this.states.get(tenant.id);
      if (!existing) {
        const started = tenant.status === "connected" ? nowIso() : undefined;
        this.states.set(tenant.id, {
          tenantId: tenant.id,
          tenantName: tenant.displayName,
          status: tenant.status,
          running: tenant.status === "connected",
          lastStartedAt: started,
          processedInbound: 0,
          processedOutbound: 0
        });
        continue;
      }
      existing.tenantName = tenant.displayName;
      existing.status = tenant.status;
      existing.running = tenant.status === "connected";
      if (tenant.status === "connected" && !existing.lastStartedAt) {
        existing.lastStartedAt = nowIso();
      }
      if (tenant.status === "disconnected" && !existing.lastStoppedAt) {
        existing.lastStoppedAt = nowIso();
      }
    }

    for (const tenantId of this.states.keys()) {
      if (!currentIds.has(tenantId)) {
        this.states.delete(tenantId);
      }
    }
  }

  connect(tenant: WhatsAppTenant): TenantWorkerState {
    const existing = this.states.get(tenant.id);
    const next: TenantWorkerState = {
      tenantId: tenant.id,
      tenantName: tenant.displayName,
      status: "connected",
      running: true,
      lastStartedAt: nowIso(),
      lastStoppedAt: existing?.lastStoppedAt,
      lastInboundAt: existing?.lastInboundAt,
      lastOutboundAt: existing?.lastOutboundAt,
      processedInbound: existing?.processedInbound ?? 0,
      processedOutbound: existing?.processedOutbound ?? 0,
      lastError: existing?.lastError
    };
    this.states.set(tenant.id, next);
    return next;
  }

  disconnect(tenant: WhatsAppTenant): TenantWorkerState {
    const existing = this.states.get(tenant.id);
    const next: TenantWorkerState = {
      tenantId: tenant.id,
      tenantName: tenant.displayName,
      status: "disconnected",
      running: false,
      lastStartedAt: existing?.lastStartedAt,
      lastStoppedAt: nowIso(),
      lastInboundAt: existing?.lastInboundAt,
      lastOutboundAt: existing?.lastOutboundAt,
      processedInbound: existing?.processedInbound ?? 0,
      processedOutbound: existing?.processedOutbound ?? 0,
      lastError: existing?.lastError
    };
    this.states.set(tenant.id, next);
    return next;
  }

  noteInbound(tenantId: string): void {
    const state = this.states.get(tenantId);
    if (!state) return;
    state.lastInboundAt = nowIso();
    state.processedInbound += 1;
  }

  noteOutbound(tenantId: string): void {
    const state = this.states.get(tenantId);
    if (!state) return;
    state.lastOutboundAt = nowIso();
    state.processedOutbound += 1;
  }

  noteError(tenantId: string, error: string): void {
    const state = this.states.get(tenantId);
    if (!state) return;
    state.lastError = error;
  }

  get(tenantId: string): TenantWorkerState | null {
    const state = this.states.get(tenantId);
    return state ? { ...state } : null;
  }

  list(): TenantWorkerState[] {
    return Array.from(this.states.values())
      .map((state) => ({ ...state }))
      .sort((a, b) => a.tenantName.localeCompare(b.tenantName));
  }
}
