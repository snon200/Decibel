import { apiGet, apiPatch, apiPost } from "../api";
import type { RunTarget, Test, UpdateTestInput } from "../types/suite";
import type { Run } from "../types/runs";

export const regenerateSuite = (agentId: string) =>
	apiPost<Test[]>(`/agents/${agentId}/regenerate-suite`);

export const listTestsForAgent = (agentId: string) =>
	apiGet<Test[]>(`/agents/${agentId}/tests`);

export const getTest = (id: string) => apiGet<Test>(`/tests/${id}`);

export const updateTest = (id: string, patch: UpdateTestInput) =>
	apiPatch<Test>(`/tests/${id}`, patch);

export const startTestRun = (testId: string, target?: RunTarget) =>
	apiPost<Run>(`/tests/${testId}/run`, {
		target: target ?? { kind: "user_bot" },
	});

export const startSuiteRun = (agentId: string, target?: RunTarget) =>
	apiPost<Run[]>(`/agents/${agentId}/run-suite`, {
		target: target ?? { kind: "user_bot" },
	});
