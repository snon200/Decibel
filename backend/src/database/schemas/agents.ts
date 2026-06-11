import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const agents = pgTable("agents", {
	id: uuid("id").defaultRandom().primaryKey(),
	name: text("name").notNull(),
	phoneNumber: text("phone_number").notNull(),
	description: text("description").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
});

export type Agent = InferSelectModel<typeof agents>;
export type NewAgent = InferInsertModel<typeof agents>;
