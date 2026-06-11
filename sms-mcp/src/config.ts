import { config as loadEnv } from "dotenv";

loadEnv();

export const config = {
	DIAL_API_KEY: process.env.DIAL_API_KEY ?? "",
	DIAL_BASE_URL: process.env.DIAL_BASE_URL ?? "https://getdial.ai",
	PORT: Number(process.env.PORT ?? 8787),
};

if (!config.DIAL_API_KEY) {
	console.error("DIAL_API_KEY is not set — copy .env.example to .env and fill it in.");
	process.exit(1);
}
