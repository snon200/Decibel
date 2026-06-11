import { getProvider } from "../../providers/registry.ts";
import type { ProviderName } from "../../providers/types.ts";
import { logger } from "../../lib/logger.ts";
import type { Run } from "../../database/schemas/runs.ts";

/**
 * Returns a playable recording URL for the run.
 *
 * Dial hands back a *short-lived* signed URL, so the value persisted at
 * ingestion time may have expired by the time someone opens the run. We mint a
 * fresh one on read, falling back to the stored URL if the refresh fails (e.g.
 * provider hiccup). Competitor providers expose no recording, so we just return
 * whatever was stored (typically null).
 */
export const resolveRecordingUrl = async (run: Run): Promise<string | null> => {
	if (run.provider !== "dial" || !run.externalCallId) {
		return run.audioUrl ?? null;
	}

	try {
		const provider = getProvider(run.provider as ProviderName);
		const fresh = await provider.getRecordingUrl({
			externalCallId: run.externalCallId,
		});
		return fresh ?? run.audioUrl ?? null;
	} catch (err) {
		logger.warn("Failed to refresh recording URL; using stored value", {
			runId: run.id,
			error: err instanceof Error ? err.message : String(err),
		});
		return run.audioUrl ?? null;
	}
};
