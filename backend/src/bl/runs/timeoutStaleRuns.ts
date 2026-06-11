import * as RunsDal from "../../dal/runs.ts";
import { logger } from "../../lib/logger.ts";

/** Cap a single call's wallclock duration. Phone calls don't take longer than this. */
export const RUN_TIMEOUT_SECONDS = 5 * 60;

/**
 * Sweep runs whose status is still non-terminal long after the call should
 * have ended (line unreachable, provider silently dropped the update, etc.)
 * and mark them as failed so the dashboard reflects reality.
 */
export const timeoutStaleRuns = async (): Promise<void> => {
	const stuck = await RunsDal.listTimedOutRuns({
		olderThanSeconds: RUN_TIMEOUT_SECONDS,
	});
	if (stuck.length === 0) return;

	logger.info("timing out stale runs", { count: stuck.length });

	const message = `Call did not complete within ${Math.round(RUN_TIMEOUT_SECONDS / 60)} minutes — line unreachable or provider unresponsive.`;
	for (const run of stuck) {
		try {
			await RunsDal.applyRunUpdate({
				id: run.id,
				update: {
					status: "failed",
					error: message,
					completedAt: new Date(),
				},
			});
			logger.warn("run timed out → marked failed", {
				runId: run.id,
				externalCallId: run.externalCallId,
				previousStatus: run.status,
				ageSeconds: Math.round(
					(Date.now() - new Date(run.createdAt).getTime()) / 1000,
				),
			});
		} catch (err) {
			logger.error("timeoutStaleRuns: failed to mark one run", {
				runId: run.id,
				error: err instanceof Error ? err.message : String(err),
			});
		}
	}
};
