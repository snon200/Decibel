import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as AgentsApi from "../api/agents";
import type { CreateAgentInput } from "../types/agents";

export const agentsKey = ["agents"] as const;
export const agentKey = (id: string) => ["agent", id] as const;

export const useAgentsList = () =>
	useQuery({
		queryKey: agentsKey,
		queryFn: AgentsApi.listAgents,
	});

export const useAgent = (id: string | undefined) =>
	useQuery({
		queryKey: id ? agentKey(id) : ["agent", "missing"],
		queryFn: () => AgentsApi.getAgent(id as string),
		enabled: Boolean(id),
	});

export const useCreateAgent = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (input: CreateAgentInput) => AgentsApi.createAgent(input),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: agentsKey });
		},
	});
};

export const useUpdateAgent = (id: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (patch: {
			name?: string;
			phoneNumber?: string;
			description?: string;
		}) => AgentsApi.updateAgent(id, patch),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: agentKey(id) });
			void qc.invalidateQueries({ queryKey: agentsKey });
		},
	});
};

export const useDeleteAgent = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => AgentsApi.deleteAgent(id),
		onSuccess: (_data, id) => {
			qc.removeQueries({ queryKey: agentKey(id) });
			void qc.invalidateQueries({ queryKey: agentsKey });
		},
	});
};
