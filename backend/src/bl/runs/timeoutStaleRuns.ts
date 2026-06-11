import * as RunsDal from "../../dal/runs.ts";
import { logger } from "../../lib/logger.ts";
import { getProvider } from "../../providers/registry.ts";
import type { ProviderName } from "../../providers/types.ts";

/**
 * Hard cap on a single call's wallclock duration.
 *
 * Once a non-terminal run is older than this, the sweep asks the provider to
 * end the call (best-effort — Dial currently has no hang-up REST endpoint) and
 * marks the run as `failed` so our system stops polling, retrying, or judging
 * it. The DB row is the source of truth for the dashboard; the underlying call
 * may continue at the vendor.
 */
export const MAX_CALL_DURATION_SECONDS = 10 * 60;

// Back-compat alias for any imports that still reference the old name.
export const RUN_TIMEOUT_SECONDS = MAX_CALL_DURATION_SECONDS;

/**
 * Sweep runs whose status is still non-terminal past the maximum call
 * duration. Tries to tear the call down at the provider, then marks the run
 * failed so the dashboard reflects reality.
 */
export const timeoutStaleRuns = async (): Promise<void> => {
	const stuck = await RunsDal.listTimedOutRuns({
		olderThanSeconds: MAX_CALL_DURATION_SECONDS,
	});
	if (stuck.length === 0) return;

	const cap = Math.round(MAX_CALL_DURATION_SECONDS / 60);
	logger.info("timing out stale runs", { count: stuck.length, capMinutes: cap });

	const message = `Call exceeded the ${cap}-minute maximum and was terminated.`;

	for (const run of stuck) {
		// Best-effort hang-up. Dial doesn't expose a termination endpoint, so the
		// default no-op fires and the call continues at the vendor until natural
		// end — but our row goes terminal here either way.
		if (run.externalCallId) {
			try {
				const provider = getProvider(run.provider as ProviderName);
				await provider.endCall({ externalCallId: run.externalCallId });
			} catch (err) {
				logger.warn("timeoutStaleRuns: provider.endCall threw", {
					runId: run.id,
					externalCallId: run.externalCallId,
					error: err instanceof Error ? err.message : String(err),
				});
			}
		}

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
				capMinutes: cap,
			});
		} catch (err) {
			logger.error("timeoutStaleRuns: failed to mark one run", {
				runId: run.id,
				error: err instanceof Error ? err.message : String(err),
			});
		}
	}
};
