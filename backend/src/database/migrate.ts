import { existsSync } from "node:fs";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "./data-source.ts";

const migrationsFolder = "./drizzle";

const run = async () => {
	if (!existsSync(`${migrationsFolder}/meta/_journal.json`)) {
		console.log("No migrations to apply — generate some with `npm run db:generate`.");
		return;
	}
	await migrate(db, { migrationsFolder });
	console.log("Migrations applied successfully");
};

run()
	.catch((err) => {
		console.error("Migration failed:", err);
		process.exit(1);
	})
	.finally(() => pool.end());
