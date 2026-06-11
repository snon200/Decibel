import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { tests } from "./tests.ts";

export type TargetKind = "user_bot" | "competitor";

export const runs = pgTable(
	"runs",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		testId: uuid("test_id")
			.notNull()
			.references(() => tests.id, { onDelete: "cascade" }),
		targetKind: text("target_kind").$type<TargetKind>().notNull(),
		targetLabel: text("target_label").notNull(),
		targetPhoneNumber: text("target_phone_number").notNull(),
		provider: text("provider").notNull().default("dial"),
		externalCallId: text("external_call_id"),
		status: text("status").notNull(),
		transcript: text("transcript"),
		audioUrl: text("audio_url"),
		durationSeconds: integer("duration_seconds"),
		overallScore: integer("overall_score"),
		error: text("error"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		completedAt: timestamp("completed_at", { withTimezone: true }),
	},
	(t) => [
		index("runs_test_id_idx").on(t.testId),
		index("runs_external_call_id_idx").on(t.externalCallId),
		index("runs_status_idx").on(t.status),
	],
);

export type Run = InferSelectModel<typeof runs>;
export type NewRun = InferInsertModel<typeof runs>;
