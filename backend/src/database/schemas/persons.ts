import type { InferSelectModel } from "drizzle-orm";
import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const persons = pgTable("persons", {
	personId: uuid("person_id").defaultRandom().primaryKey(),
	name: varchar("name").notNull(),
	document: varchar("document").notNull(),
	birthDate: timestamp("birth_date").notNull(),
});

export type Person = InferSelectModel<typeof persons>;
