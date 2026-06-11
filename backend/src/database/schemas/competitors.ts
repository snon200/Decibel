import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { agents } from "./agents.ts";

export const competitors = pgTable(
	"competitors",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		agentId: uuid("agent_id")
			.notNull()
			.references(() => agents.id, { onDelete: "cascade" }),
		platform: text("platform").notNull(),
		externalAgentId: text("external_agent_id").notNull(),
		phoneNumber: text("phone_number").notNull(),
		simulationPrompt: text("simulation_prompt").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		deletedAt: timestamp("deleted_at", { withTimezone: true }),
	},
	(t) => [index("competitors_agent_id_idx").on(t.agentId)],
);

export type Competitor = InferSelectModel<typeof competitors>;
export type NewCompetitor = InferInsertModel<typeof competitors>;
