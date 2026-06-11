import { Run } from "./Run.ts";
import type { Run as RunRow } from "../../database/schemas/runs.ts";
import type { RunUpdate } from "../../dal/runs.ts";
import type { PlaceCallInput, VoiceProvider } from "../../providers/types.ts";
import { TERMINAL_STATUSES } from "../../providers/types.ts";
import type { CallStatus } from "../../providers/types.ts";

/**
 * Hydrate the in-memory Run state machine from a DB row.
 *
 * The Run class is per-process and not persistent; the DB row is its
 * persistent twin. Every time we touch a run from a webhook or poller, we
 * rebuild a Run from the row, fold the new info in via applyEvent/refresh,
 * then persist the resulting state via toUpdate.
 */
export const rehydrate = (input: {
	runRow: RunRow;
	provider: VoiceProvider;
	input: PlaceCallInput;
}): Run => {
	const run = new Run({ provider: input.provider, input: input.input });
	run.externalCallId = input.runRow.externalCallId;
	run.status = input.runRow.status as CallStatus;
	run.durationSeconds = input.runRow.durationSeconds;
	run.transcript = input.runRow.transcript;
	// We don't persist recordingAvailable; treat the URL as our source of truth.
	run.recordingAvailable = Boolean(input.runRow.audioUrl);
	return run;
};

export const toUpdate = (run: Run, opts?: { audioUrl?: string | null }): RunUpdate => {
	const update: RunUpdate = {
		status: run.status,
		durationSeconds: run.durationSeconds,
		transcript: run.transcript,
	};
	if (opts && "audioUrl" in opts) {
		update.audioUrl = opts.audioUrl ?? null;
	}
	return update;
};

export const isTerminal = (status: CallStatus): boolean =>
	TERMINAL_STATUSES.has(status);

export const isTerminalString = (status: string): boolean =>
	TERMINAL_STATUSES.has(status as CallStatus);
