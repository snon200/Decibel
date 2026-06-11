import { apiGet, apiPost } from "../api";
import type { Run, RunDetail } from "../types/runs";

export const getRun = (id: string) => apiGet<RunDetail>(`/runs/${id}`);

export const listRunsForTest = (testId: string) =>
	apiGet<Run[]>(`/tests/${testId}/runs`);

export const cancelRun = (id: string) => apiPost<Run>(`/runs/${id}/cancel`);
