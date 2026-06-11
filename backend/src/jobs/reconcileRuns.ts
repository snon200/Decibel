import * as RunsDal from "../dal/runs.ts";
import { logger } from "../lib/logger.ts";
import { runWithConcurrency } from "../lib/concurrency.ts";
import { ingestCallResult } from "../bl/runs/ingestCallResult.ts";

// Polling is the only convergence mechanism (no webhooks). Stop polling a run
// once it is fully resolved, but give late-arriving transcripts a generous
// window — never poll a row older than this.
const MAX_AGE_SECONDS = 30 * 60;
const CONCURRENCY = 5;

/**
 * Poll every in-flight run (and any completed run still missing its transcript)
 * and fold the latest provider state into the DB. This is the sole path that
 * drives a call from "queued" to "completed" + transcribed + judged.
 */
export const reconcileRuns = async (): Promise<void> => {
	const active = await RunsDal.listRunsToPoll({
		maxAgeSeconds: MAX_AGE_SECONDS,
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
