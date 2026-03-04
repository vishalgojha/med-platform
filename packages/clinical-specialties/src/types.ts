export type SupportedLanguage = "en" | "hi";

export type CareSetting = "clinic" | "hospital";

export type DeploymentPhase = "core" | "expanded" | "advanced";

export type SpecialtyCategory =
  | "primary-care"
  | "medical"
  | "surgical"
  | "women-and-child"
  | "diagnostics"
  | "supportive"
  | "population-health";

export type AgentCapability =
  | "triage"
  | "consultation"
  | "documentation"
  | "diagnostics"
  | "procedure-planning"
  | "care-coordination"
  | "medication-safety"
  | "discharge-and-followup"
  | "abdm-compliance"
  | "billing-and-coding";

export interface SpecialtyDefinition {
  id: string;
  labels: Record<SupportedLanguage, string>;
  category: SpecialtyCategory;
  settings: CareSetting[];
  deploymentPhase: DeploymentPhase;
  requiredCapabilities: AgentCapability[];
}
