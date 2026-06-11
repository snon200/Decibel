import { config } from "../../config/env.ts";

const VAPI_BASE_URL = "https://api.vapi.ai";

export const vapiRequest = async <T>(input: {
	path: string;
	method?: "GET" | "POST";
	body?: unknown;
}): Promise<T> => {
	const { path, method = "GET", body } = input;
	if (!config.VAPI_API_KEY) {
		throw new Error("VAPI_API_KEY is not configured");
	}

	const headers: Record<string, string> = {
		Authorization: `Bearer ${config.VAPI_API_KEY}`,
	};
	if (body !== undefined) headers["Content-Type"] = "application/json";

	const init: RequestInit = { method, headers };
	if (body !== undefined) init.body = JSON.stringify(body);

	const response = await fetch(`${VAPI_BASE_URL}${path}`, init);

	if (!response.ok) {
		const text = await response.text();
		throw new Error(`VAPI ${method} ${path} failed: ${response.status} ${text}`);
	}

	return (await response.json()) as T;
};
