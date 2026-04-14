import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "./data-source.ts";

migrate(db, { migrationsFolder: "./drizzle" })
	.then(() => {
		console.log("Migrations applied successfully");
		pool.end();
	})
	.catch((err) => {
		console.error("Migration failed:", err);
		pool.end();
		process.exit(1);
	});
