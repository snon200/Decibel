import type { InferSelectModel } from "drizzle-orm";
import { integer, pgTable } from "drizzle-orm/pg-core";

export const counter = pgTable("counter", {
	id: integer("id").primaryKey(),
	value: integer("value").notNull().default(0),
});

export type Counter = InferSelectModel<typeof counter>;
