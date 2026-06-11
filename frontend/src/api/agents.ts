import { apiGet, apiPatch, apiPost } from "../api";
import type {
	Agent,
	AgentDetail,
	CreateAgentInput,
	CreateAgentResult,
} from "../types/agents";

export const listAgents = () => apiGet<Agent[]>("/agents");

export const getAgent = (id: string) => apiGet<AgentDetail>(`/agents/${id}`);

export const createAgent = (input: CreateAgentInput) =>
	apiPost<CreateAgentResult>("/agents", input);

export const updateAgent = (
	id: string,
	patch: { name?: string; phoneNumber?: string; description?: string },
) => apiPatch<Agent>(`/agents/${id}`, patch);
