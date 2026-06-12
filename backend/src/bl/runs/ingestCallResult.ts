import * as RunsDal from "../../dal/runs.ts";
import * as TestsDal from "../../dal/tests.ts";
import { logger } from "../../lib/logger.ts";
import { getProvider } from "../../providers/registry.ts";
import { rehydrate, toUpdate, isTerminalString } from "./runAdapter.ts";
import { judgeAndPersist } from "./judgeAndPersist.ts";
import { retryRun, shouldRetry } from "./retryRun.ts";
import { correlateSms } from "./correlateSms.ts";
import { fetchWebhookSends } from "./fetchWebhookSends.ts";
import type { PlaceCallInput, ProviderName } from "../../providers/types.ts";

const buildPlaceCallStub = (): PlaceCallInput => ({
	// Rehydrate doesn't reach back through the provider for placeCall, but the
	// Run constructor demands a non-null input. Stub is fine — we never call
	// run.start() during ingest.
	to: "",
	systemPrompt: "",
});

/**
 * Poll a single in-flight run: re-read its call from the provider, persist the
 * canonical state, and kick off judging once it lands transcribed + terminal.
 * Driven by the reconcile poller — there is no webhook path.
 */
export const ingestCallResult = async (input: {
	externalCallId: string;
}): Promise<void> => {
	const runRow = await RunsDal.getRunByExternalCallId({
		externalCallId: input.externalCallId,
	});
	if (!runRow) {
		logger.warn("ingestCallResult: orphan call", {
			externalCallId: input.externalCallId,
		});
		return;
	}

	// Idempotent short-circuit: nothing more to do if already fully resolved.
	// "Resolved" also means the recording is captured for Dial runs (which always
	// have one for a completed call); competitor providers expose no recording.
	const alreadyTerminal = isTerminalString(runRow.status);
	const recordingResolved =
		runRow.provider !== "dial" || Boolean(runRow.audioUrl);
	if (
		alreadyTerminal &&
		runRow.transcript &&
		runRow.overallScore !== null &&
		recordingResolved
	) {
		return;
	}

	const provider = getProvider(runRow.provider as ProviderName);
	const run = rehydrate({ runRow, provider, input: buildPlaceCallStub() });

	// Read the canonical snapshot from the provider (status, duration, transcript).
	try {
		await run.refresh();
	} catch (err) {
		logger.warn("ingestCallResult: provider.getCall failed; persisting partial", {
			runId: runRow.id,
			externalCallId: input.externalCallId,
			error: err instanceof Error ? err.message : String(err),
		});
	}

	let audioUrl: string | null = runRow.audioUrl;
	if (run.isTerminal && run.recordingAvailable && !audioUrl) {
		try {
			audioUrl = await run.getRecordingUrl();
		} catch (err) {
			logger.warn("ingestCallResult: getRecordingUrl failed", {
				runId: runRow.id,
				error: err instanceof Error ? err.message : String(err),
			});
		}
	}

	const update = toUpdate(run, { audioUrl });
	if (run.isTerminal && !runRow.completedAt) {
		update.completedAt = new Date();
	}
	const persisted = await RunsDal.applyRunUpdate({
		id: runRow.id,
		update,
	});

	logger.info("ingest applied", {
		runId: runRow.id,
		externalCallId: input.externalCallId,
		status: persisted.status,
		terminal: run.isTerminal,
		hasTranscript: Boolean(persisted.transcript),
	});

	if (run.isTerminal && shouldRetry(persisted)) {
		void retryRun({ originalRunRow: persisted }).catch((err) => {
			logger.error("retryRun threw", {
				runId: persisted.id,
				error: err instanceof Error ? err.message : String(err),
			});
		});
	}

	if (
		run.isTerminal &&
		persisted.transcript &&
		persisted.overallScore === null
	) {
		// Capture SMS the agent sent around the call before judging, so the judge
		// can score SMS-related criteria. Window = [call start, now] (transcript
		// just landed). Best-effort: a failure here must not block judging.
		if (persisted.provider === "dial") {
			try {
				// Two evidence sources: SMS the agent really sent to our Dial number
				// (Dial agents), and texts/payment-links a non-Dial agent asked our
				// webhook tools to send (e.g. an ElevenLabs AUT, self-logged).
				const [dialMessages, webhookMessages] = await Promise.all([
					correlateSms({ run: persisted }),
					fetchWebhookSends({ run: persisted }),
				]);
				const messages = [...dialMessages, ...webhookMessages].sort((a, b) =>
					a.createdAt.localeCompare(b.createdAt),
				);
				await RunsDal.setRunMessages({ id: persisted.id, messages });
				if (messages.length > 0) {
					logger.info("ingest: correlated SMS", {
						runId: persisted.id,
						count: messages.length,
						webhook: webhookMessages.length,
					});
				}
			} catch (err) {
				logger.warn("ingest: SMS correlation failed", {
					runId: persisted.id,
					error: err instanceof Error ? err.message : String(err),
				});
			}
		}

		// fire-and-forget; judge errors land in the retry job
		const test = await TestsDal.getTest({ id: persisted.testId });
		if (!test) {
			logger.warn("ingest: cannot judge — test row missing", {
				runId: persisted.id,
				testId: persisted.testId,
			});
			return;
		}
		void judgeAndPersist({ runId: persisted.id }).catch((err) => {
			logger.error("judgeAndPersist threw", {
				runId: persisted.id,
				error: err instanceof Error ? err.message : String(err),
			});
		});
	}
};
