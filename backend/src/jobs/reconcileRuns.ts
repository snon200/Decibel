import * as RunsDal from "../dal/runs.ts";
import { logger } from "../lib/logger.ts";
import { runWithConcurrency } from "../lib/concurrency.ts";
import { ingestCallResult } from "../bl/runs/ingestCallResult.ts";

// Polling is the only convergence mechanism (no webhooks), so sweep every
// in-flight run that already has a provider call id — including brand-new ones.
const STALE_AFTER_SECONDS = 0;
const CONCURRENCY = 5;

/**
 * Poll every non-terminal run with a provider call id and fold the latest
 * provider state into the DB. This is the sole path that drives a call from
 * "queued" to "completed" + judged.
 */
export const reconcileRuns = async (): Promise<void> => {
	const active = await RunsDal.listStaleRuns({
		olderThanSeconds: STALE_AFTER_SECONDS,
	});
	if (active.length === 0) return;

	logger.info("reconcileRuns polling", { count: active.length });

	await runWithConcurrency(active, CONCURRENCY, async (runRow) => {
		if (!runRow.externalCallId) return;
		try {
			await ingestCallResult({ externalCallId: runRow.externalCallId });
		} catch (err) {
			logger.warn("reconcileRuns: one run failed", {
				runId: runRow.id,
				externalCallId: runRow.externalCallId,
				error: err instanceof Error ? err.message : String(err),
			});
		}
	});
};
