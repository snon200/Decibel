import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as SuiteApi from "../api/suite";
import { agentKey } from "./useAgents";
import type { AgentDetail } from "../types/agents";
import type { RunTarget, UpdateTestInput } from "../types/suite";
import type { CallStatus, Run } from "../types/runs";

const fakeRun = (testId: string, agent: AgentDetail["agent"]): Run => ({
	id: `optimistic-${testId}-${Date.now()}`,
	testId,
	targetKind: "user_bot",
	targetLabel: "User bot",
	targetPhoneNumber: agent.phoneNumber,
	provider: "dial",
	externalCallId: null,
	status: "queued" as CallStatus,
	transcript: null,
	messages: null,
	audioUrl: null,
	durationSeconds: null,
	overallScore: null,
	error: null,
	createdAt: new Date().toISOString(),
	completedAt: null,
});

export const useRegenerateSuite = (agentId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: () => SuiteApi.regenerateSuite(agentId),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: agentKey(agentId) });
		},
	});
};

export const useUpdateTest = (agentId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, patch }: { id: string; patch: UpdateTestInput }) =>
			SuiteApi.updateTest(id, patch),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: agentKey(agentId) });
		},
	});
};

export const useStartTestRun = (agentId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ testId, target }: { testId: string; target?: RunTarget }) =>
			SuiteApi.startTestRun(testId, target),
		onMutate: async ({ testId }) => {
			await qc.cancelQueries({ queryKey: agentKey(agentId) });
			const previous = qc.getQueryData<AgentDetail>(agentKey(agentId));
			if (previous) {
				const optimistic = fakeRun(testId, previous.agent);
				qc.setQueryData<AgentDetail>(agentKey(agentId), {
					...previous,
					latestRunsByTest: {
						...previous.latestRunsByTest,
						[testId]: optimistic,
					},
				});
			}
			return { previous };
		},
		onError: (_err, _vars, ctx) => {
			if (ctx?.previous)
				qc.setQueryData(agentKey(agentId), ctx.previous);
		},
		onSuccess: (run) => {
			const current = qc.getQueryData<AgentDetail>(agentKey(agentId));
			if (!current) return;
			qc.setQueryData<AgentDetail>(agentKey(agentId), {
				...current,
				latestRunsByTest: {
					...current.latestRunsByTest,
					[run.testId]: run,
				},
			});
		},
	});
};

export const useStartSuiteRun = (agentId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ target }: { target?: RunTarget }) =>
			SuiteApi.startSuiteRun(agentId, target),
		onMutate: async () => {
			await qc.cancelQueries({ queryKey: agentKey(agentId) });
			const previous = qc.getQueryData<AgentDetail>(agentKey(agentId));
			if (previous) {
				const next = { ...previous.latestRunsByTest };
				for (const test of previous.tests) {
					next[test.id] = fakeRun(test.id, previous.agent);
				}
				qc.setQueryData<AgentDetail>(agentKey(agentId), {
					...previous,
					latestRunsByTest: next,
				});
			}
			return { previous };
		},
		onError: (_err, _vars, ctx) => {
			if (ctx?.previous)
				qc.setQueryData(agentKey(agentId), ctx.previous);
		},
		onSuccess: (runs) => {
			const current = qc.getQueryData<AgentDetail>(agentKey(agentId));
			if (!current) return;
			const next = { ...current.latestRunsByTest };
			for (const run of runs) next[run.testId] = run;
			qc.setQueryData<AgentDetail>(agentKey(agentId), {
				...current,
				latestRunsByTest: next,
			});
		},
	});
};
