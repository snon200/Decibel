import { config } from "../../config/env.ts";

export const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io";

export const elevenRequest = async <T>(input: {
	path: string;
	method?: "GET" | "POST" | "PATCH";
	body?: unknown;
}): Promise<T> => {
	const { path, method = "GET", body } = input;
	if (!config.ELEVENLABS_API_KEY) {
		throw new Error("ELEVENLABS_API_KEY is not configured");
	}

	const headers: Record<string, string> = {
		"xi-api-key": config.ELEVENLABS_API_KEY,
	};
	if (body !== undefined) headers["Content-Type"] = "application/json";

	const init: RequestInit = { method, headers };
	if (body !== undefined) init.body = JSON.stringify(body);

	const response = await fetch(`${ELEVENLABS_BASE_URL}${path}`, init);

	if (!response.ok) {
		const text = await response.text();
		throw new Error(
			`ElevenLabs ${method} ${path} failed: ${response.status} ${text}`,
		);
	}

	return (await response.json()) as T;
};
