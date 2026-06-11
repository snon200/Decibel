import * as RunsDal from "../../dal/runs.ts";
import { BadRequestError, NotFoundError } from "../../lib/errors.ts";
import { logger } from "../../lib/logger.ts";
import type { Run as RunRow } from "../../database/schemas/runs.ts";
import type { CallStatus } from "../../providers/types.ts";

/**
 * Statuses a user is allowed to cancel from.
 * - `queued` / `ringing`: the line hasn't connected yet — safe to bail out.
 * - `busy`: terminal, but a retry attempt may be scheduled (see retryRun).
 *           Cancelling busy aborts the next attempt in the chain.
 *
 * `in_progress` is intentionally excluded — the user explicitly asked NOT to
 * cancel mid-call. Already-final statuses are no-ops.
 */
export const CANCELLABLE_STATUSES: ReadonlySet<CallStatus> = new Set<CallStatus>([
	"queued",
	"ringing",
	"busy",
]);

export const isCancellableStatus = (status: string): boolean =>
	CANCELLABLE_STATUSES.has(status as CallStatus);

export const cancelRun = async (input: { id: string }): Promise<RunRow> => {
	const run = await RunsDal.getRun({ id: input.id });
	if (!run) throw new NotFoundError("Run");
	if (!isCancellableStatus(run.status)) {
		throw new BadRequestError(
			`Run is ${run.status} — only queued, ringing, or busy runs can be cancelled.`,
		);
	}

	const updated = await RunsDal.applyRunUpdate({
		id: run.id,
		update: {
			status: "canceled",
			error: "Cancelled by user",
			completedAt: new Date(),
		},
	});

	logger.info("run cancelled", {
		runId: run.id,
		previousStatus: run.status,
		externalCallId: run.externalCallId,
	});

	return updated;
};
