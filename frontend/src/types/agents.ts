import type { Test } from "./suite";
import type { Run } from "./runs";

export type Agent = {
	id: string;
	name: string;
	phoneNumber: string;
	description: string;
	createdAt: string;
};

export type CreateAgentInput = {
	name?: string;
	phoneNumber: string;
	description: string;
};

export type CreateAgentResult = {
	agent: Agent;
	tests: Test[];
	suiteError?: string;
};

export type AgentDetail = {
	agent: Agent;
	tests: Test[];
	latestRunsByTest: Record<string, Run | null>;
};
