import { apiGet } from "../api";
import type { RunDetail } from "../types/runs";

export const getRun = (id: string) => apiGet<RunDetail>(`/runs/${id}`);
