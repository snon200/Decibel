import { config as loadDotenv } from "dotenv";
import { z } from "zod";

// Base, committed defaults (DB, non-secret config).
loadDotenv();
// Local, git-ignored secrets/overrides (API keys, number ids). Wins over .env.
loadDotenv({ path: ".env.local", override: true });

const envSchema = z.object({
	PORT: z.coerce.number().default(3000),
	PUBLIC_BASE_URL: z.string().optional(),

	DIAL_API_KEY: z.string().optional(),
	DIAL_FROM_NUMBER_ID: z.string().optional(),
	DIAL_WEBHOOK_SECRET: z.string().optional(),

	VAPI_API_KEY: z.string().optional(),
	VAPI_PHONE_NUMBER_ID: z.string().optional(),
	VAPI_ASSISTANT_ID: z.string().optional(),
	VAPI_WEBHOOK_SECRET: z.string().optional(),

	ELEVENLABS_API_KEY: z.string().optional(),
	ELEVENLABS_AGENT_ID: z.string().optional(),
	ELEVENLABS_PHONE_NUMBER_ID: z.string().optional(),
	ELEVENLABS_WEBHOOK_SECRET: z.string().optional(),

	OPENAI_API_KEY: z.string().optional(),
	OPENAI_MODEL: z.string().default("gpt-4o"),

});

export const config = envSchema.parse(process.env);
