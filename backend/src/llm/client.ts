import OpenAI from "openai";
import { z } from "zod";
import { config } from "../config/env.ts";
import { LlmParseError } from "../lib/errors.ts";
import { logger } from "../lib/logger.ts";

export interface CompleteOptions {
	system: string;
	user: string;
	temperature?: number;
	maxTokens?: number;
}

export interface CompleteJsonOptions<T> extends CompleteOptions {
	schema: z.ZodType<T>;
	retries?: number;
}

export interface LlmClient {
	complete(opts: CompleteOptions): Promise<string>;
	completeJson<T>(opts: CompleteJsonOptions<T>): Promise<T>;
}

const requireKey = (): string => {
	if (!config.OPENAI_API_KEY) {
		throw new Error(
			"OPENAI_API_KEY is not set — required for LLM calls (suite generation, judging)",
		);
	}
	return config.OPENAI_API_KEY;
};

let cachedClient: OpenAI | null = null;
const getOpenAI = (): OpenAI => {
	if (!cachedClient) cachedClient = new OpenAI({ apiKey: requireKey() });
	return cachedClient;
};

const JSON_DIRECTIVE =
	"\n\nRespond with a single JSON object that matches the requested schema. " +
	"Do not include prose, explanations, or markdown fences.";

const RETRY_DIRECTIVE =
	"\n\nYour previous response did not parse as JSON. Output ONLY a JSON object that matches the schema.";

export const createOpenAiClient = (): LlmClient => {
	const complete = async (opts: CompleteOptions): Promise<string> => {
		const client = getOpenAI();
		const response = await client.chat.completions.create({
			model: config.OPENAI_MODEL,
			temperature: opts.temperature ?? 0.3,
			max_tokens: opts.maxTokens ?? 2048,
			messages: [
				{ role: "system", content: opts.system },
				{ role: "user", content: opts.user },
			],
		});
		const content = response.choices[0]?.message?.content;
		if (!content) throw new Error("OpenAI returned empty content");
		return content;
	};

	const completeJsonOnce = async (opts: CompleteOptions): Promise<string> => {
		const client = getOpenAI();
		const response = await client.chat.completions.create({
			model: config.OPENAI_MODEL,
			temperature: opts.temperature ?? 0.3,
			max_tokens: opts.maxTokens ?? 2048,
			response_format: { type: "json_object" },
			messages: [
				{ role: "system", content: opts.system },
				{ role: "user", content: opts.user },
			],
		});
		const content = response.choices[0]?.message?.content;
		if (!content) throw new Error("OpenAI returned empty content");
		return content;
	};

	const completeJson = async <T>(opts: CompleteJsonOptions<T>): Promise<T> => {
		const retries = opts.retries ?? 1;
		let lastError: unknown = null;
		let systemPrompt = opts.system + JSON_DIRECTIVE;

		for (let attempt = 0; attempt <= retries; attempt++) {
			let raw = "";
			try {
				raw = await completeJsonOnce({
					...opts,
					system: systemPrompt,
				});
				const parsed = JSON.parse(raw);
				return opts.schema.parse(parsed);
			} catch (err) {
				lastError = err;
				logger.warn("llm completeJson failed attempt", {
					attempt,
					error: err instanceof Error ? err.message : String(err),
					rawPrefix: raw.slice(0, 200),
				});
				systemPrompt = opts.system + JSON_DIRECTIVE + RETRY_DIRECTIVE;
			}
		}

		throw new LlmParseError(
			lastError instanceof Error ? lastError.message : String(lastError),
		);
	};

	return { complete, completeJson };
};

export const llm: LlmClient = createOpenAiClient();
