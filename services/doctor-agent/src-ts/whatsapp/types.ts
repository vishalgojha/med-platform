import type { SupportedLanguage } from "@med-platform/clinical-specialties";
import type { OrchestrationWorkflow } from "../orchestration/router.js";

export type WhatsAppTenantStatus = "connected" | "disconnected";
export type WhatsAppProvider = "twilio" | "whatsapp_web";
export type WhatsAppMessageDirection = "inbound" | "outbound";

export interface WhatsAppTenant {
  id: string;
  displayName: string;
  status: WhatsAppTenantStatus;
  provider: WhatsAppProvider;
  whatsappNumber: string;
  twilioAccountSid: string;
  twilioFromNumber: string;
  aiModel: string;
  defaultSpecialtyId: string;
  defaultWorkflow: OrchestrationWorkflow;
  defaultLanguage: SupportedLanguage;
  defaultDoctorId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppTenantSecrets {
  twilioAuthToken?: string;
  anthropicApiKey: string;
}

export interface WhatsAppTenantWithSecrets extends WhatsAppTenant, WhatsAppTenantSecrets {}

export interface WhatsAppConversation {
  id: string;
  tenantId: string;
  userPhone: string;
  patientId: string;
  doctorId: string;
  specialtyId: string;
  language: SupportedLanguage;
  lastInboundMessageSid?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppMessageEvent {
  id: string;
  tenantId: string;
  conversationId?: string;
  direction: WhatsAppMessageDirection;
  providerMessageId: string;
  fromPhone: string;
  toPhone: string;
  body: string;
  status: string;
  metadata: string;
  createdAt: string;
}
