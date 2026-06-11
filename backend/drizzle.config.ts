import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

dotenv.config();

export default defineConfig({
	schema: "./src/database/schemas/index.ts",
	out: "./drizzle",
	dialect: "postgresql",
	dbCredentials: {
		host: process.env.DB_HOST ?? "localhost",
		port: Number(process.env.DB_PORT ?? 5432),
		user: process.env.DB_USER ?? "postgres",
		password: process.env.DB_PASSWORD ?? "postgres",
		database: process.env.DB_NAME ?? "dial_hackathon",
	},
});
