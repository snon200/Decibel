import { config } from "../../config/env.ts";

const DIAL_BASE_URL = "https://getdial.ai";

export const dialRequest = async <T>(input: {
	path: string;
	method?: "GET" | "POST" | "PATCH";
	body?: unknown;
	idempotencyKey?: string;
}): Promise<T> => {
	const { path, method = "GET", body, idempotencyKey } = input;
	if (!config.DIAL_API_KEY) {
		throw new Error("DIAL_API_KEY is not configured");
	}

	const headers: Record<string, string> = {
		Authorization: `Bearer ${config.DIAL_API_KEY}`,
		// Required: the /recording route does content negotiation and returns an
		// empty body without an explicit JSON Accept header.
		Accept: "application/json",
	};
	if (body !== undefined) headers["Content-Type"] = "application/json";
	if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;

	const init: RequestInit = { method, headers };
	if (body !== undefined) init.body = JSON.stringify(body);

	const response = await fetch(`${DIAL_BASE_URL}${path}`, init);

	if (!response.ok) {
		const text = await response.text();
		throw new Error(`Dial ${method} ${path} failed: ${response.status} ${text}`);
	}

	return (await response.json()) as T;
};
