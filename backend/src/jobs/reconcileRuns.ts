import * as RunsDal from "../dal/runs.ts";
import { getProvider } from "../providers/registry.ts";
import { logger } from "../lib/logger.ts";
import { runWithConcurrency } from "../lib/concurrency.ts";
import { ingestCallResult } from "../bl/runs/ingestCallResult.ts";
import type { ProviderName } from "../providers/types.ts";

const STALE_AFTER_SECONDS = 30;
const CONCURRENCY = 5;

export const reconcileRuns = async (): Promise<void> => {
	const stale = await RunsDal.listStaleRuns({
		olderThanSeconds: STALE_AFTER_SECONDS,
	});
	if (stale.length === 0) return;

	logger.info("reconcileRuns sweeping", { count: stale.length });

	await runWithConcurrency(stale, CONCURRENCY, async (runRow) => {
		if (!runRow.externalCallId) return;
		try {
			const provider = getProvider(runRow.provider as ProviderName);
			const snapshot = await provider.getCall({
				externalCallId: runRow.externalCallId,
			});
			await ingestCallResult({
				externalCallId: runRow.externalCallId,
				snapshot,
			});
		} catch (err) {
			logger.warn("reconcileRuns: one run failed", {
				runId: runRow.id,
				externalCallId: runRow.externalCallId,
				error: err instanceof Error ? err.message : String(err),
			});
		}
	});
};
