import * as RunsDal from "../../dal/runs.ts";
import { logger } from "../../lib/logger.ts";
import { startRunResolved } from "./startRun.ts";
import type { Run as RunRow, TargetKind } from "../../database/schemas/runs.ts";

/** Maximum attempts including the original — 3 means initial + 2 retries. */
export const MAX_BUSY_ATTEMPTS = 3;

/**
 * Delay before kicking off a retry so we don't slam an engaged line.
 * Short enough that the dashboard still feels responsive.
 */
const RETRY_DELAY_MS = 10_000;

/**
 * Retriable terminal statuses. We retry `busy` (engaged line) only — `no_answer`
 * and `failed` are stronger signals that something is wrong, and we don't want
 * to burn cost re-dialing them.
 */
const RETRIABLE_STATUSES: ReadonlySet<string> = new Set(["busy"]);

const wait = (ms: number): Promise<void> =>
	new Promise((resolve) => setTimeout(resolve, ms));

/** True if the just-finished run was a retriable terminal state with budget left. */
export const shouldRetry = (run: RunRow): boolean =>
	RETRIABLE_STATUSES.has(run.status) && run.attemptNumber < MAX_BUSY_ATTEMPTS;

/**
 * Spawn a fresh run row for the same test + target with attempt_number bumped.
 * Fires the new outbound call against the same phone the original used; the
 * inbound configuration on competitor platforms is left intact from the
 * original attempt (re-resolving would replace the simulation prompt and
 * isn't worth the round trip for a same-second retry).
 */
export const retryRun = async (input: {
	originalRunRow: RunRow;
}): Promise<RunRow | null> => {
	const old = input.originalRunRow;
	if (!shouldRetry(old)) return null;

	const nextAttempt = old.attemptNumber + 1;
	logger.info("scheduling retry", {
		originalRunId: old.id,
		testId: old.testId,
		attempt: nextAttempt,
		maxAttempts: MAX_BUSY_ATTEMPTS,
		delayMs: RETRY_DELAY_MS,
	});

	await wait(RETRY_DELAY_MS);

	// The user may have hit Cancel during the delay — re-read the row and
	// abort if the original run was marked canceled in the meantime.
	const fresh = await RunsDal.getRun({ id: old.id });
	if (!fresh || fresh.status === "canceled") {
		logger.info("retryRun aborted — original was cancelled", {
			originalRunId: old.id,
		});
		return null;
	}

	try {
		return await startRunResolved({
			testId: old.testId,
			resolved: {
				kind: old.targetKind as TargetKind,
				label: old.targetLabel,
				phoneNumber: old.targetPhoneNumber,
			},
			attemptNumber: nextAttempt,
		});
	} catch (err) {
		logger.error("retryRun failed to start replacement", {
			originalRunId: old.id,
			error: err instanceof Error ? err.message : String(err),
		});
		return null;
	}
};
