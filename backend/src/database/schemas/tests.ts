import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { agents } from "./agents.ts";

export type Criterion = {
	id: string;
	text: string;
};

export const tests = pgTable(
	"tests",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		agentId: uuid("agent_id")
			.notNull()
			.references(() => agents.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		scenarioSummary: text("scenario_summary").notNull(),
		testerInstruction: text("tester_instruction").notNull(),
		criteria: jsonb("criteria").$type<Criterion[]>().notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => [index("tests_agent_id_idx").on(t.agentId)],
);

export type Test = InferSelectModel<typeof tests>;
export type NewTest = InferInsertModel<typeof tests>;
