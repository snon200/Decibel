import { config as loadDotenv } from "dotenv";
import { z } from "zod";

// Base, committed defaults (DB, non-secret config).
loadDotenv();
// Local, git-ignored secrets/overrides (API keys, number ids). Wins over .env.
loadDotenv({ path: ".env.local", override: true });

const envSchema = z.object({
	PORT: z.coerce.number().default(3000),

	DIAL_API_KEY: z.string().optional(),
	DIAL_FROM_NUMBER_ID: z.string().optional(),

	VAPI_API_KEY: z.string().optional(),
	VAPI_PHONE_NUMBER_ID: z.string().optional(),
	VAPI_ASSISTANT_ID: z.string().optional(),

	ELEVENLABS_API_KEY: z.string().optional(),
	ELEVENLABS_AGENT_ID: z.string().optional(),
	ELEVENLABS_PHONE_NUMBER_ID: z.string().optional(),

	OPENAI_API_KEY: z.string().optional(),
	OPENAI_MODEL: z.string().default("gpt-4o"),

	// The sms-mcp service exposes /sent-log — the evidence source for SMS/payment
	// sent by non-Dial agents (e.g. an ElevenLabs AUT). Same machine by default.
	SMS_MCP_INTERNAL_URL: z.string().default("http://localhost:8787"),
	// Public (ngrok) base URL of sms-mcp, used to build ElevenLabs webhook-tool
	// URLs the EL agent calls mid-conversation. Unset → EL agent gets no tools.
	SMS_MCP_PUBLIC_URL: z.string().optional(),
});

export const config = envSchema.parse(process.env);
