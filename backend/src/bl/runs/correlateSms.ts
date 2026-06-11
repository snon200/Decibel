import { config } from "../../config/env.ts";
import { listDialMessages } from "../../providers/dial/getMessages.ts";
import { logger } from "../../lib/logger.ts";
import type { CorrelatedMessage, Run } from "../../database/schemas/runs.ts";

/** Digits-only suffix compare so +972..., 0..., and spacing variants still match. */
const samePhone = (a: string, b: string): boolean => {
	const da = a.replace(/\D/g, "");
	const db = b.replace(/\D/g, "");
	if (!da || !db) return false;
	const len = Math.min(da.length, db.length, 10);
	return da.slice(-len) === db.slice(-len);
};

/**
 * Find SMS the agent-under-test sent to our Dial number around the call.
 *
 * Dial has no native call↔message link, so we correlate by phone number + time:
 * inbound messages on our number, from the call's other party, that arrived
 * after the call started. The caller decides the upper bound by *when* they call
 * this (we run it the moment the transcript lands), so the window is naturally
 * "[call start, transcript ready]".
 */
export const correlateSms = async (input: {
	run: Run;
}): Promise<CorrelatedMessage[]> => {
	const { run } = input;
	if (run.provider !== "dial") return [];
	if (!config.DIAL_FROM_NUMBER_ID) {
		logger.warn("correlateSms: DIAL_FROM_NUMBER_ID unset; skipping", {
			runId: run.id,
		});
		return [];
	}

	const since = run.createdAt.toISOString();
	const messages = await listDialMessages({
		numberId: config.DIAL_FROM_NUMBER_ID,
		direction: "inbound",
		since,
	});

	const callEnd = run.completedAt ? run.completedAt.getTime() : null;

	return messages
		.filter((m) => samePhone(m.from, run.targetPhoneNumber))
		.map((m) => {
			const at = new Date(m.createdAt).getTime();
			return {
				id: m.id,
				from: m.from,
				to: m.to,
				body: m.body,
				channel: m.channel,
				direction: m.direction,
				createdAt: m.createdAt,
				secondsFromCallEnd:
					callEnd === null ? null : Math.round((at - callEnd) / 1000),
			} satisfies CorrelatedMessage;
		})
		.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
};
