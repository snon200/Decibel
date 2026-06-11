import * as RunsDal from "../../dal/runs.ts";
import * as TestsDal from "../../dal/tests.ts";
import { logger } from "../../lib/logger.ts";
import { getProvider } from "../../providers/registry.ts";
import { rehydrate, toUpdate, isTerminalString } from "./runAdapter.ts";
import { judgeAndPersist } from "./judgeAndPersist.ts";
import type {
	NormalizedCall,
	NormalizedCallEvent,
	PlaceCallInput,
	ProviderName,
} from "../../providers/types.ts";

const buildPlaceCallStub = (): PlaceCallInput => ({
	// Rehydrate doesn't reach back through the provider for placeCall, but the
	// Run constructor demands a non-null input. Stub is fine — we never call
	// run.start() during ingest.
	to: "",
	systemPrompt: "",
});

export const ingestCallResult = async (input: {
	externalCallId: string;
	event?: NormalizedCallEvent;
	snapshot?: NormalizedCall;
}): Promise<void> => {
	const runRow = await RunsDal.getRunByExternalCallId({
		externalCallId: input.externalCallId,
	});
	if (!runRow) {
		logger.warn("ingestCallResult: orphan event", {
			externalCallId: input.externalCallId,
		});
		return;
	}

	// Idempotent short-circuit: nothing more to do if already fully resolved.
	const alreadyTerminal = isTerminalString(runRow.status);
	if (alreadyTerminal && runRow.transcript && runRow.overallScore !== null) {
		return;
	}

	const provider = getProvider(runRow.provider as ProviderName);
	const run = rehydrate({ runRow, provider, input: buildPlaceCallStub() });

	if (input.event) run.applyEvent(input.event);

	// Always refresh from the provider for the canonical snapshot (status,
	// duration, transcript). Webhooks are thin; refresh gives us everything.
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

	if (
		run.isTerminal &&
		persisted.transcript &&
		persisted.overallScore === null
	) {
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
