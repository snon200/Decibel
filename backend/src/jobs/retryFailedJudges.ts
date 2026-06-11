import { and, eq, isNotNull, isNull, ne, sql } from "drizzle-orm";
import { db } from "../database/data-source.ts";
import { runs } from "../database/schemas/runs.ts";
import { judgeAndPersist } from "../bl/runs/judgeAndPersist.ts";
import { logger } from "../lib/logger.ts";

export const retryFailedJudges = async (): Promise<void> => {
	// Find completed runs that have a transcript but no overall_score yet.
	// These are runs where ingest succeeded but the fire-and-forget judge
	// failed (or hasn't fired). Cap to 20 per sweep to avoid storming the LLM.
	const candidates = await db
		.select({ id: runs.id })
		.from(runs)
		.where(
			and(
				eq(runs.status, "completed"),
				isNotNull(runs.transcript),
				isNull(runs.overallScore),
				// Skip rows updated in the last 30s so we don't race the fire-and-forget judge
				sql`${runs.completedAt} < now() - interval '30 seconds'`,
				ne(runs.transcript, ""),
			),
		)
		.limit(20);

	if (candidates.length === 0) return;
	logger.info("retryFailedJudges sweeping", { count: candidates.length });

	for (const c of candidates) {
		try {
			await judgeAndPersist({ runId: c.id });
		} catch (err) {
			logger.warn("retryFailedJudges: one judge failed", {
				runId: c.id,
				error: err instanceof Error ? err.message : String(err),
			});
		}
	}
};
