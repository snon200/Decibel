import { useQuery } from "@tanstack/react-query";
import * as RunsApi from "../api/runs";
import { isTerminal } from "../types/runs";

export const runKey = (id: string) => ["run", id] as const;
export const testRunsKey = (testId: string) => ["test", testId, "runs"] as const;

export const useRun = (id: string | undefined) =>
	useQuery({
		queryKey: id ? runKey(id) : ["run", "missing"],
		queryFn: () => RunsApi.getRun(id as string),
		enabled: Boolean(id),
		refetchInterval: (query) => {
			const data = query.state.data;
			if (!data) return 1500;
			return isTerminal(data.run.status) ? false : 1500;
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
