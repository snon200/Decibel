import { useQuery } from "@tanstack/react-query";
import * as RunsApi from "../api/runs";
import { isTerminal } from "../types/runs";

export const runKey = (id: string) => ["run", id] as const;

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
