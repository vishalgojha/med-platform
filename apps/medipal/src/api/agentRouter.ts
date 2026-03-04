type AgentLanguage = "en" | "hi";
type AgentSetting = "clinic" | "hospital";

export type AgentWorkflow =
  | "triage_intake"
  | "consultation_documentation"
  | "prior_authorization"
  | "follow_up_outreach";

interface ApiSuccess<T> {
  ok: true;
  data: T;
}

interface ApiFailure {
  ok: false;
  code?: string;
  message?: string;
}

export interface AgentSpecialtyDirectoryEntry {
  id: string;
  label: string;
  labels: Record<AgentLanguage, string>;
  category: string;
  settings: AgentSetting[];
  deploymentPhase: string;
  requiredCapabilities: string[];
}

export interface AgentRoleDefinition {
  id: string;
  displayName: string;
  capabilities: string[];
  supportedLanguages: AgentLanguage[];
}

export interface AgentDeploymentProfileRoute {
  specialtyId: string;
  leadAgent: string;
  supportAgents: string[];
}

export interface AgentDeploymentProfile {
  country: "IN";
  primaryLanguages: AgentLanguage[];
  routes: AgentDeploymentProfileRoute[];
  roles: AgentRoleDefinition[];
}

export interface ExecuteAgentWorkflowRequest {
  workflow: AgentWorkflow;
  specialtyId: string;
  doctorId: string;
  patientId?: string;
  payload: Record<string, unknown>;
  dryRun?: boolean;
  confirm?: boolean;
}

export interface ExecuteAgentWorkflowResult {
  workflow: AgentWorkflow;
  specialtyId: string;
  specialtyName: string;
  leadAgent: string;
  supportAgents: string[];
  steps: Array<{
    agentId: string;
    capability: string;
    output: unknown;
  }>;
}

const DEFAULT_AGENT_API_BASE_URL = "http://127.0.0.1:3001";

const getAgentApiBaseUrl = (): string => {
  const configured = (import.meta.env.VITE_AGENT_API_BASE_URL as string | undefined)?.trim();
  const base = configured && configured.length > 0 ? configured : DEFAULT_AGENT_API_BASE_URL;
  return base.replace(/\/+$/, "");
};

const getAuthToken = (): string | undefined => {
  const token = (import.meta.env.VITE_AGENT_API_TOKEN as string | undefined)?.trim();
  return token && token.length > 0 ? token : undefined;
};

const toQuery = (params: Record<string, string | undefined>): string => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      search.set(key, value);
    }
  });
  const query = search.toString();
  return query ? `?${query}` : "";
};

async function agentRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(init?.headers ?? {});
  if (!headers.has("content-type") && init?.body) {
    headers.set("content-type", "application/json");
  }
  if (token) {
    headers.set("authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${getAgentApiBaseUrl()}${path}`, {
    ...init,
    headers,
  });

  const payload = (await response.json().catch(() => null)) as ApiSuccess<T> | ApiFailure | null;
  if (!response.ok || !payload || payload.ok !== true) {
    const message =
      payload && payload.ok === false && payload.message
        ? payload.message
        : `Agent API request failed (${response.status})`;
    throw new Error(message);
  }

  return payload.data;
}

export async function listSpecialties(options: {
  setting?: AgentSetting;
  language?: AgentLanguage;
} = {}): Promise<AgentSpecialtyDirectoryEntry[]> {
  return agentRequest<AgentSpecialtyDirectoryEntry[]>(
    `/api/specialties${toQuery({
      setting: options.setting,
      language: options.language,
    })}`,
  );
}

export async function getIndiaAgentDeploymentProfile(
  languages: AgentLanguage[] = ["en", "hi"],
): Promise<AgentDeploymentProfile> {
  return agentRequest<AgentDeploymentProfile>(
    `/api/agents/deployment-profile${toQuery({
      languages: languages.length > 0 ? languages.join(",") : undefined,
    })}`,
  );
}

export async function executeAgentWorkflow(
  input: ExecuteAgentWorkflowRequest,
): Promise<ExecuteAgentWorkflowResult> {
  return agentRequest<ExecuteAgentWorkflowResult>("/api/agent-router/execute", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
