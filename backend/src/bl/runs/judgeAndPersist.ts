import { judgeRun } from "../scoring/judgeRun.ts";
import { logger } from "../../lib/logger.ts";

/**
 * Thin wrapper around bl/scoring.judgeRun so callers (ingestCallResult fire-and-forget,
 * jobs/retryFailedJudges) share one entry point and one error-handling shape.
 */
export const judgeAndPersist = async (input: { runId: string }): Promise<void> => {
	try {
		await judgeRun({ runId: input.runId });
	} catch (err) {
		logger.warn("judgeAndPersist: judge failed (will retry later)", {
			runId: input.runId,
			error: err instanceof Error ? err.message : String(err),
		});
		throw err;
	}
};
