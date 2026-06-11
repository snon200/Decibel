import { config } from "../config/env.ts";
import { LlmParseError } from "../lib/errors.ts";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

interface ChatCompletionResponse {
	choices?: { message?: { content?: string } }[];
}

/**
 * The single LLM entry point for the app (suite generation + judging). No vendor
 * SDK — a plain fetch to OpenAI keeps it consistent with the provider clients.
 * When `json` is set the model is asked for a JSON object and the parsed value is
 * returned (callers validate the shape with Zod).
 */
export const complete = async (input: {
	system: string;
	user: string;
	json?: boolean;
	temperature?: number;
}): Promise<unknown> => {
	if (!config.OPENAI_API_KEY) {
		throw new Error("OPENAI_API_KEY is not configured");
	}

	const body: Record<string, unknown> = {
		model: config.OPENAI_MODEL,
		temperature: input.temperature ?? 0.7,
		messages: [
			{ role: "system", content: input.system },
			{ role: "user", content: input.user },
		],
	};
	if (input.json) body["response_format"] = { type: "json_object" };

	const response = await fetch(OPENAI_URL, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${config.OPENAI_API_KEY}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(`OpenAI request failed: ${response.status} ${text}`);
	}

	const data = (await response.json()) as ChatCompletionResponse;
	const content = data.choices?.[0]?.message?.content;
	if (!content) throw new LlmParseError("empty completion");
	if (!input.json) return content;

	try {
		return JSON.parse(content);
	} catch {
		throw new LlmParseError(content.slice(0, 300));
	}
};
