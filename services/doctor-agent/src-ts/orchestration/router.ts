import {
  SPECIALTIES,
  getSpecialtyById,
  listSpecialtiesBySetting,
  type CareSetting,
  type SupportedLanguage,
} from "@med-platform/clinical-specialties";
import {
  buildIndiaDeploymentProfile,
  getSpecialtyRoute,
  type IndiaDeploymentProfile,
} from "@med-platform/agent-orchestrator";
import { createIntent } from "../engine/intent.js";
import { executeIntent, type CapabilityHandler, type ExecuteOptions } from "../engine/executor.js";
import { appError } from "../errors.js";
import type { CapabilityName, StructuredError } from "../types.js";

export type OrchestrationWorkflow =
  | "triage_intake"
  | "consultation_documentation"
  | "prior_authorization"
  | "follow_up_outreach";

export interface WorkflowExecutionInput {
  workflow: OrchestrationWorkflow;
  specialtyId: string;
  doctorId: string;
  patientId?: string;
  payload: Record<string, unknown>;
  dryRun: boolean;
}

export interface WorkflowExecutionSuccess {
  workflow: OrchestrationWorkflow;
  specialtyId: string;
  specialtyName: string;
  leadAgent: string;
  supportAgents: string[];
  steps: Array<{
    agentId: string;
    capability: CapabilityName;
    output: unknown;
  }>;
}

export interface WorkflowPlanStep {
  agentId: string;
  capability: CapabilityName;
}

interface WorkflowPlan {
  primary: WorkflowPlanStep;
  optional?: WorkflowPlanStep;
}

export const LEGACY_SPECIALTY_ALIAS: Record<string, string> = {
  primary_care: "family_medicine",
  emergency: "emergency_medicine",
  oncology: "medical_oncology",
  psychiatry: "psychiatry",
  hospitalist: "internal_medicine",
  surgery: "general_surgery",
  general: "family_medicine",
};

export const LEGACY_SPECIALTY_VALUES = Object.keys(LEGACY_SPECIALTY_ALIAS);

export const SPECIALTY_VALID_VALUES = Array.from(
  new Set([...LEGACY_SPECIALTY_VALUES, ...SPECIALTIES.map((specialty) => specialty.id)]),
);

export const WORKFLOW_VALID_VALUES: OrchestrationWorkflow[] = [
  "triage_intake",
  "consultation_documentation",
  "prior_authorization",
  "follow_up_outreach",
];

export function normalizeSpecialtyId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (getSpecialtyById(normalized)) return normalized;
  return LEGACY_SPECIALTY_ALIAS[normalized] ?? null;
}

export function parseLanguage(value: unknown): SupportedLanguage | null {
  if (value === "en" || value === "hi") return value;
  return null;
}

export function parseSetting(value: unknown): CareSetting | null {
  if (value === "clinic" || value === "hospital") return value;
  return null;
}

export function parseWorkflow(value: unknown): OrchestrationWorkflow | null {
  return WORKFLOW_VALID_VALUES.includes(value as OrchestrationWorkflow)
    ? (value as OrchestrationWorkflow)
    : null;
}

export function getSpecialtyValidationMessage(): string {
  return `specialtyId must be one of: ${SPECIALTY_VALID_VALUES.join(", ")}`;
}

export function getWorkflowValidationMessage(): string {
  return `workflow must be one of: ${WORKFLOW_VALID_VALUES.join(", ")}`;
}

export function listSpecialtyDirectory(options?: {
  setting?: CareSetting;
  language?: SupportedLanguage;
}): Array<{
  id: string;
  label: string;
  labels: Record<SupportedLanguage, string>;
  category: string;
  settings: CareSetting[];
  deploymentPhase: string;
  requiredCapabilities: string[];
}> {
  const language = options?.language ?? "en";
  const source = options?.setting ? listSpecialtiesBySetting(options.setting) : SPECIALTIES;
  return source.map((specialty) => ({
    id: specialty.id,
    label: specialty.labels[language],
    labels: specialty.labels,
    category: specialty.category,
    settings: specialty.settings,
    deploymentPhase: specialty.deploymentPhase,
    requiredCapabilities: specialty.requiredCapabilities,
  }));
}

export function getIndiaProfile(languages?: SupportedLanguage[]): IndiaDeploymentProfile {
  const finalLanguages: SupportedLanguage[] =
    Array.isArray(languages) && languages.length > 0 ? Array.from(new Set(languages)) : ["en", "hi"];
  return buildIndiaDeploymentProfile(finalLanguages);
}

function riskForCapability(capability: CapabilityName, payload: Record<string, unknown>): "LOW" | "MEDIUM" | "HIGH" {
  if (capability === "prior_auth" && payload.submit === true) return "HIGH";
  if (capability === "follow_up" && payload.sendNow === true) return "HIGH";
  return capability === "scribe" || capability === "decision_support" ? "LOW" : "MEDIUM";
}

function hasNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validateWorkflowInput(input: WorkflowExecutionInput): StructuredError | null {
  if (!getSpecialtyById(input.specialtyId)) {
    return appError("VALIDATION_ERROR", getSpecialtyValidationMessage());
  }
  if (!hasNonEmptyString(input.doctorId)) {
    return appError("VALIDATION_ERROR", "doctorId is required");
  }

  if (input.workflow === "triage_intake") {
    if (!hasNonEmptyString(input.payload.query)) {
      return appError("VALIDATION_ERROR", "payload.query is required for triage_intake");
    }
    return null;
  }

  if (input.workflow === "consultation_documentation") {
    if (!hasNonEmptyString(input.patientId)) {
      return appError("VALIDATION_ERROR", "patientId is required for consultation_documentation");
    }
    if (!hasNonEmptyString(input.payload.transcript)) {
      return appError("VALIDATION_ERROR", "payload.transcript is required for consultation_documentation");
    }
    return null;
  }

  if (input.workflow === "prior_authorization") {
    if (!hasNonEmptyString(input.patientId)) {
      return appError("VALIDATION_ERROR", "patientId is required for prior_authorization");
    }
    if (!hasNonEmptyString(input.payload.procedureCode)) {
      return appError("VALIDATION_ERROR", "payload.procedureCode is required for prior_authorization");
    }
    if (!hasNonEmptyString(input.payload.insurerId)) {
      return appError("VALIDATION_ERROR", "payload.insurerId is required for prior_authorization");
    }
    if (!Array.isArray(input.payload.diagnosisCodes)) {
      return appError("VALIDATION_ERROR", "payload.diagnosisCodes must be a string[]");
    }
    return null;
  }

  if (input.workflow === "follow_up_outreach") {
    if (!hasNonEmptyString(input.patientId)) {
      return appError("VALIDATION_ERROR", "patientId is required for follow_up_outreach");
    }
    if (!hasNonEmptyString(input.payload.trigger)) {
      return appError("VALIDATION_ERROR", "payload.trigger is required for follow_up_outreach");
    }
    return null;
  }

  return null;
}

function buildWorkflowPlan(workflow: OrchestrationWorkflow, payload: Record<string, unknown>): WorkflowPlan {
  if (workflow === "triage_intake") {
    return {
      primary: {
        agentId: "intake_triage_agent",
        capability: "decision_support",
      },
    };
  }

  if (workflow === "consultation_documentation") {
    return {
      primary: {
        agentId: "documentation_agent",
        capability: "scribe",
      },
      optional: hasNonEmptyString(payload.query)
        ? {
            agentId: "specialist_copilot_agent",
            capability: "decision_support",
          }
        : undefined,
    };
  }

  if (workflow === "prior_authorization") {
    return {
      primary: {
        agentId: "abdm_compliance_agent",
        capability: "prior_auth",
      },
    };
  }

  return {
    primary: {
      agentId: "care_coordinator_agent",
      capability: "follow_up",
    },
  };
}

function resolvePayloadForCapability(
  capability: CapabilityName,
  basePayload: Record<string, unknown>,
  doctorId: string,
  patientId?: string,
): Record<string, unknown> {
  const payload = { ...basePayload };
  if (!payload.doctorId) payload.doctorId = doctorId;
  if (!payload.patientId && patientId) payload.patientId = patientId;

  if (capability === "decision_support" && !hasNonEmptyString(payload.query)) {
    payload.query = "Provide triage guidance based on the clinical context.";
  }

  return payload;
}

async function executeStep(
  step: WorkflowPlanStep,
  input: WorkflowExecutionInput,
  handlers: Record<CapabilityName, CapabilityHandler>,
  options: ExecuteOptions,
): Promise<{ ok: true; output: unknown } | StructuredError> {
  const payload = resolvePayloadForCapability(step.capability, input.payload, input.doctorId, input.patientId);
  const intent = createIntent({
    capability: step.capability,
    doctorId: input.doctorId,
    patientId: input.patientId,
    payload,
    risk: riskForCapability(step.capability, payload),
    dryRun: input.dryRun,
  });
  const execution = await executeIntent(intent, handlers, options);
  if (execution.ok === false) {
    return execution;
  }
  return { ok: true, output: execution.output };
}

export async function executeAgentWorkflow(
  input: WorkflowExecutionInput,
  handlers: Record<CapabilityName, CapabilityHandler>,
  options: ExecuteOptions,
): Promise<WorkflowExecutionSuccess | StructuredError> {
  const validation = validateWorkflowInput(input);
  if (validation) return validation;

  const profile = getIndiaProfile();
  const route = getSpecialtyRoute(profile, input.specialtyId);
  const specialty = getSpecialtyById(input.specialtyId);
  if (!route || !specialty) {
    return appError("NOT_FOUND", "Specialty routing not found");
  }

  const plan = buildWorkflowPlan(input.workflow, input.payload);
  const stepsToRun = plan.optional ? [plan.primary, plan.optional] : [plan.primary];
  const steps: WorkflowExecutionSuccess["steps"] = [];

  for (const step of stepsToRun) {
    const result = await executeStep(step, input, handlers, options);
    if (result.ok === false) {
      return result;
    }
    steps.push({
      agentId: step.agentId,
      capability: step.capability,
      output: result.output,
    });
  }

  return {
    workflow: input.workflow,
    specialtyId: input.specialtyId,
    specialtyName: specialty.labels.en,
    leadAgent: route.leadAgent,
    supportAgents: route.supportAgents,
    steps,
  };
}
