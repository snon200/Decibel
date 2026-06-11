import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	pgTable,
	text,
	timestamp,
	unique,
	uuid,
} from "drizzle-orm/pg-core";
import { runs } from "./runs.ts";

export const scores = pgTable(
	"scores",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		runId: uuid("run_id")
			.notNull()
			.references(() => runs.id, { onDelete: "cascade" }),
		criterionId: text("criterion_id").notNull(),
		passed: boolean("passed").notNull(),
		score: integer("score").notNull(),
		justification: text("justification").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => [
		index("scores_run_id_idx").on(t.runId),
		unique("scores_run_criterion_unique").on(t.runId, t.criterionId),
	],
);

export type Score = InferSelectModel<typeof scores>;
export type NewScore = InferInsertModel<typeof scores>;
