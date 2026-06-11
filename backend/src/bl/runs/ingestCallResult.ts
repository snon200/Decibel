import * as RunsDal from "../../dal/runs.ts";
import * as TestsDal from "../../dal/tests.ts";
import * as ScoresDal from "../../dal/scores.ts";
import { getProvider } from "../../providers/registry.ts";
import { judgeRun } from "../scoring/index.ts";
import { logger } from "../../lib/logger.ts";
import { TERMINAL_STATUSES } from "../../providers/types.ts";
import type { CallStatus, ProviderName } from "../../providers/types.ts";

/**
 * The single funnel for call results — used by BOTH the Dial webhook and the
 * reconcile poller. Keyed on `externalCallId` and authoritative: it re-reads the
 * call from the provider so it converges to the same state regardless of which
 * path (webhook vs poll) arrives first. Idempotent — safe to call repeatedly.
 */
export const ingestCallResult = async (input: {
	providerName: ProviderName;
	externalCallId: string;
}): Promise<void> => {
	const run = await RunsDal.getRunByExternalCallId({
		externalCallId: input.externalCallId,
	});
	if (!run) {
		logger.info("ingest: no run for external call id", {
			externalCallId: input.externalCallId,
		});
		return;
	}

	// Already finished and scored — nothing left to do.
	const alreadyTerminal = TERMINAL_STATUSES.has(run.status as CallStatus);
	if (alreadyTerminal && run.overallScore !== null) return;

	const provider = getProvider(input.providerName);
	const call = await provider.getCall({ externalCallId: input.externalCallId });

	const terminal = TERMINAL_STATUSES.has(call.status);
	const update: RunsDal.RunUpdate = { status: call.status };
	if (call.transcript !== null) update.transcript = call.transcript;
	if (call.durationSeconds !== null) update.durationSeconds = call.durationSeconds;
	if (terminal && !run.completedAt) update.completedAt = new Date();

	if (call.recordingAvailable) {
		try {
			const url = await provider.getRecordingUrl({
				externalCallId: input.externalCallId,
			});
			if (url) update.audioUrl = url;
		} catch (err) {
			logger.warn("ingest: recording fetch failed", {
				runId: run.id,
				error: err instanceof Error ? err.message : String(err),
			});
		}
	}

	await RunsDal.applyRunUpdate({ id: run.id, update });

	// Judge once: only when the call completed with a transcript and we haven't
	// scored it yet (dedupe across webhook + poll).
	if (call.status === "completed" && call.transcript) {
		const existing = await ScoresDal.getScoresForRun({ runId: run.id });
		if (existing.length === 0) {
			const test = await TestsDal.getTest({ id: run.testId });
			if (test) {
				await judgeRun({ runId: run.id, test, transcript: call.transcript });
			}
		}
	}
};
