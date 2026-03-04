import type { AgentCapability, SupportedLanguage } from "@med-platform/clinical-specialties";

export type AgentRoleId =
  | "intake_triage_agent"
  | "specialist_copilot_agent"
  | "documentation_agent"
  | "diagnostics_agent"
  | "care_coordinator_agent"
  | "abdm_compliance_agent"
  | "revenue_cycle_agent"
  | "patient_engagement_agent";

export interface AgentRoleDefinition {
  id: AgentRoleId;
  displayName: string;
  capabilities: AgentCapability[];
  supportedLanguages: SupportedLanguage[];
}

export interface SpecialtyRoute {
  specialtyId: string;
  leadAgent: AgentRoleId;
  supportAgents: AgentRoleId[];
}

export interface IndiaDeploymentProfile {
  country: "IN";
  primaryLanguages: SupportedLanguage[];
  routes: SpecialtyRoute[];
  roles: AgentRoleDefinition[];
}
