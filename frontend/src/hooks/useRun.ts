import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as RunsApi from "../api/runs";
import { agentKey } from "./useAgents";
import type { AgentDetail } from "../types/agents";
import { isTerminal, type RunDetail } from "../types/runs";

export const runKey = (id: string) => ["run", id] as const;
export const testRunsKey = (testId: string) => ["test", testId, "runs"] as const;

export const useRun = (id: string | undefined) =>
	useQuery({
		queryKey: id ? runKey(id) : ["run", "missing"],
		queryFn: () => RunsApi.getRun(id as string),
		enabled: Boolean(id),
		// Two reasons to keep polling:
		//  1. Call still in progress (non-terminal status).
		//  2. Call finished but scoring hasn't landed yet — the judge runs
		//     fire-and-forget after the transcript arrives, so overallScore
		//     stays null for a few seconds after status flips to "completed".
		refetchInterval: (query) => {
			const data = query.state.data;
			if (!data) return 1500;
			const run = data.run;
			if (!isTerminal(run.status)) return 1500;
			const scoringPending =
				run.status === "completed" &&
				Boolean(run.transcript) &&
				run.overallScore === null;
			return scoringPending ? 1500 : false;
		},
	});

export const useTestRuns = (testId: string | undefined, enabled = true) =>
	useQuery({
		queryKey: testId ? testRunsKey(testId) : ["test", "missing", "runs"],
		queryFn: () => RunsApi.listRunsForTest(testId as string),
		enabled: Boolean(testId) && enabled,
		// While any run in the list is non-terminal, poll so the history reflects
		// in-flight runs without manual refresh.
		refetchInterval: (query) => {
			const data = query.state.data;
			if (!data || data.length === 0) return false;
			return data.some((r) => !isTerminal(r.status)) ? 1500 : false;
		},
	});

/**
 * Cancel a run.
 *
 * Optimistically updates BOTH caches so the UI reflects the cancel without a
 * refresh:
 *   - `['agent', agentId]` — flips the matching test's latest-run slot to
 *     status=canceled so the TestCard's badge updates instantly.
 *   - `['run', runId]` — flips the RunDetailPage's run.status to canceled so
 *     the badge + Cancel button on that page update instantly.
 *
 * On success the server's updated row is merged into the run cache and the
 * agent cache is invalidated to refetch authoritative state.
 */
export const useCancelRun = (agentId: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (runId: string) => RunsApi.cancelRun(runId),
		onMutate: async (runId) => {
			await Promise.all([
				qc.cancelQueries({ queryKey: agentKey(agentId) }),
				qc.cancelQueries({ queryKey: runKey(runId) }),
			]);

			const previousAgent = qc.getQueryData<AgentDetail>(agentKey(agentId));
			if (previousAgent) {
				const next: typeof previousAgent.latestRunsByTest = {
					...previousAgent.latestRunsByTest,
				};
				for (const [testId, run] of Object.entries(next)) {
					if (run && run.id === runId) {
						next[testId] = { ...run, status: "canceled" };
					}
				}
				qc.setQueryData<AgentDetail>(agentKey(agentId), {
					...previousAgent,
					latestRunsByTest: next,
				});
			}

			const previousRun = qc.getQueryData<RunDetail>(runKey(runId));
			if (previousRun) {
				qc.setQueryData<RunDetail>(runKey(runId), {
					...previousRun,
					run: { ...previousRun.run, status: "canceled" },
				});
			}

			return { previousAgent, previousRun };
		},
		onError: (_err, runId, ctx) => {
			if (ctx?.previousAgent)
				qc.setQueryData(agentKey(agentId), ctx.previousAgent);
			if (ctx?.previousRun)
				qc.setQueryData(runKey(runId), ctx.previousRun);
		},
		onSuccess: (updatedRun, runId) => {
			// Merge the server's authoritative row into the run cache (preserves
			// test/scores/audioUrl which the cancel response doesn't include).
			const current = qc.getQueryData<RunDetail>(runKey(runId));
			if (current) {
				qc.setQueryData<RunDetail>(runKey(runId), {
					...current,
					run: updatedRun,
				});
			}
			void qc.invalidateQueries({ queryKey: agentKey(agentId) });
		},
	});
};
