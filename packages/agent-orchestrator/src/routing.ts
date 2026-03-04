import {
  SPECIALTIES,
  type AgentCapability,
  type SpecialtyCategory,
  type SupportedLanguage,
} from "@med-platform/clinical-specialties";
import type { AgentRoleDefinition, AgentRoleId, IndiaDeploymentProfile, SpecialtyRoute } from "./types.js";

const DEFAULT_LANGUAGES: SupportedLanguage[] = ["en", "hi"];

function includesCapability(
  requiredCapabilities: AgentCapability[],
  capability: AgentCapability,
): boolean {
  return requiredCapabilities.includes(capability);
}

function inferLeadAgent(category: SpecialtyCategory): AgentRoleId {
  if (category === "diagnostics") {
    return "diagnostics_agent";
  }

  if (category === "supportive" || category === "population-health") {
    return "care_coordinator_agent";
  }

  if (category === "primary-care") {
    return "intake_triage_agent";
  }

  return "specialist_copilot_agent";
}

function inferSupportAgents(requiredCapabilities: AgentCapability[]): AgentRoleId[] {
  const supportAgents = new Set<AgentRoleId>([
    "documentation_agent",
    "abdm_compliance_agent",
    "patient_engagement_agent",
  ]);

  if (includesCapability(requiredCapabilities, "diagnostics")) {
    supportAgents.add("diagnostics_agent");
  }

  if (includesCapability(requiredCapabilities, "care-coordination")) {
    supportAgents.add("care_coordinator_agent");
  }

  if (includesCapability(requiredCapabilities, "billing-and-coding")) {
    supportAgents.add("revenue_cycle_agent");
  }

  if (includesCapability(requiredCapabilities, "triage")) {
    supportAgents.add("intake_triage_agent");
  }

  return Array.from(supportAgents);
}

export function buildDefaultRoles(
  supportedLanguages: SupportedLanguage[] = DEFAULT_LANGUAGES,
): AgentRoleDefinition[] {
  return [
    {
      id: "intake_triage_agent",
      displayName: "Intake & Triage Agent",
      capabilities: ["triage", "consultation", "documentation", "care-coordination"],
      supportedLanguages,
    },
    {
      id: "specialist_copilot_agent",
      displayName: "Specialist Copilot Agent",
      capabilities: [
        "consultation",
        "documentation",
        "procedure-planning",
        "medication-safety",
        "care-coordination",
      ],
      supportedLanguages,
    },
    {
      id: "documentation_agent",
      displayName: "Clinical Documentation Agent",
      capabilities: ["documentation", "discharge-and-followup", "abdm-compliance"],
      supportedLanguages,
    },
    {
      id: "diagnostics_agent",
      displayName: "Diagnostics Agent",
      capabilities: ["diagnostics", "documentation", "abdm-compliance", "billing-and-coding"],
      supportedLanguages,
    },
    {
      id: "care_coordinator_agent",
      displayName: "Care Coordination Agent",
      capabilities: [
        "consultation",
        "care-coordination",
        "discharge-and-followup",
        "medication-safety",
      ],
      supportedLanguages,
    },
    {
      id: "abdm_compliance_agent",
      displayName: "ABDM Compliance Agent",
      capabilities: ["documentation", "abdm-compliance", "billing-and-coding"],
      supportedLanguages,
    },
    {
      id: "revenue_cycle_agent",
      displayName: "Revenue Cycle Agent",
      capabilities: ["billing-and-coding", "abdm-compliance", "documentation"],
      supportedLanguages,
    },
    {
      id: "patient_engagement_agent",
      displayName: "Patient Engagement Agent",
      capabilities: ["consultation", "discharge-and-followup", "care-coordination"],
      supportedLanguages,
    },
  ];
}

export function buildIndiaDeploymentProfile(
  primaryLanguages: SupportedLanguage[] = DEFAULT_LANGUAGES,
): IndiaDeploymentProfile {
  const routes: SpecialtyRoute[] = SPECIALTIES.map((specialty) => {
    const leadAgent = inferLeadAgent(specialty.category);
    const supportAgents = inferSupportAgents(specialty.requiredCapabilities).filter(
      (agentId) => agentId !== leadAgent,
    );

    return {
      specialtyId: specialty.id,
      leadAgent,
      supportAgents,
    };
  });

  return {
    country: "IN",
    primaryLanguages,
    routes,
    roles: buildDefaultRoles(primaryLanguages),
  };
}

export function getSpecialtyRoute(
  profile: IndiaDeploymentProfile,
  specialtyId: string,
): SpecialtyRoute | undefined {
  return profile.routes.find((route) => route.specialtyId === specialtyId);
}
