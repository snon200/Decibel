import * as RunsDal from "../dal/runs.ts";
import { ingestCallResult } from "../bl/runs/index.ts";
import { logger } from "../lib/logger.ts";
import type { ProviderName } from "../providers/types.ts";

/**
 * Safety net for missed/late webhooks: sweep non-terminal runs that have been
 * dialing past a grace period and re-read them from the provider through the
 * same idempotent ingest funnel.
 */
export const reconcileRuns = async (input?: {
	olderThanSeconds?: number;
}): Promise<void> => {
	const olderThanSeconds = input?.olderThanSeconds ?? 20;
	const stale = await RunsDal.listStaleRuns({ olderThanSeconds });
	if (stale.length === 0) return;

	logger.info("reconcile: sweeping stale runs", { count: stale.length });
	for (const run of stale) {
		if (!run.externalCallId) continue;
		try {
			await ingestCallResult({
				providerName: run.provider as ProviderName,
				externalCallId: run.externalCallId,
			});
		} catch (err) {
			logger.warn("reconcile: ingest failed", {
				runId: run.id,
				error: err instanceof Error ? err.message : String(err),
			});
		}
	}
};
