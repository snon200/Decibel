import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { agents } from "./agents.ts";

/**
 * What evidence the judge should weigh for a criterion:
 *  - "transcript"   — score against the call transcript (default; the historical shape).
 *  - "received_sms" — pass iff at least one SMS arrived on the tester number from the
 *                     bot during the call window (deterministic, no LLM needed).
 *  - "sms_content"  — score against the body of any SMS received from the bot during
 *                     the call window. Auto-fails if no SMS was received.
 */
export type CriterionKind = "transcript" | "received_sms" | "sms_content";

export type Criterion = {
	id: string;
	text: string;
	/** Defaults to "transcript" when absent. */
	kind?: CriterionKind | undefined;
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
