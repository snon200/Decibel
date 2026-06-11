import { config as loadDotenv } from "dotenv";
import { z } from "zod";

loadDotenv();

const envSchema = z.object({
	PORT: z.coerce.number().default(3000),
	PUBLIC_BASE_URL: z.string().optional(),

	DIAL_API_KEY: z.string().optional(),
	DIAL_FROM_NUMBER_ID: z.string().optional(),
	DIAL_WEBHOOK_SECRET: z.string().optional(),

	VAPI_API_KEY: z.string().optional(),
	VAPI_PHONE_NUMBER_ID: z.string().optional(),
	VAPI_WEBHOOK_SECRET: z.string().optional(),

	OPENAI_API_KEY: z.string().optional(),
	OPENAI_MODEL: z.string().default("gpt-4o"),

	ELEVENLABS_API_KEY: z.string().optional(),
});

export const config = envSchema.parse(process.env);
