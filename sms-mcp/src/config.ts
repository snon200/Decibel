import { config as loadEnv } from "dotenv";

loadEnv();

export const config = {
	DIAL_API_KEY: process.env.DIAL_API_KEY ?? "",
	DIAL_BASE_URL: process.env.DIAL_BASE_URL ?? "https://getdial.ai",
	PORT: Number(process.env.PORT ?? 8787),
	// Stripe test-mode key (sk_test_...). Optional — only needed for the
	// send_payment_request tool. The payment link points here on success/cancel.
	STRIPE_API_KEY: process.env.STRIPE_API_KEY ?? "",
	STRIPE_SUCCESS_URL: process.env.STRIPE_SUCCESS_URL ?? "https://example.com/paid",
	// Optional Dial number id to send the webhook-tool texts FROM. Used by the
	// non-Dial (e.g. ElevenLabs) agent path. Falls back to the account's first
	// number. Real delivery is best-effort — the self-log is the evidence source.
	SMS_FROM_NUMBER_ID: process.env.SMS_FROM_NUMBER_ID ?? "",
};

if (!config.DIAL_API_KEY) {
	console.error("DIAL_API_KEY is not set — copy .env.example to .env and fill it in.");
	process.exit(1);
}
