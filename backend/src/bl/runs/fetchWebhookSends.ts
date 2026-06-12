import { config } from "../../config/env.ts";
import { logger } from "../../lib/logger.ts";
import type { CorrelatedMessage, Run } from "../../database/schemas/runs.ts";

interface SentRecord {
	id: string;
	kind: "sms" | "payment";
	to: string;
	body: string;
	paymentUrl?: string;
	conversationId?: string;
	delivered: boolean;
	createdAt: string;
}

/**
 * Pull texts/payment-links a non-Dial agent-under-test (e.g. ElevenLabs) asked
 * us to send through the webhook tools. The sms-mcp self-logs each one; we read
 * it back as run evidence because these never appear in Dial's message log.
 *
 * Correlated by time window [call start, transcript ready]. The recipient is our
 * own Dial tester number, so we don't filter by `to` — the window is enough for
 * the (sequential) test runs this serves.
 */
export const fetchWebhookSends = async (input: {
	run: Run;
}): Promise<CorrelatedMessage[]> => {
	const { run } = input;
	const since = run.createdAt.toISOString();
	const url = `${config.SMS_MCP_INTERNAL_URL}/sent-log?since=${encodeURIComponent(since)}`;

	let sent: SentRecord[];
	try {
		const res = await fetch(url, { headers: { Accept: "application/json" } });
		if (!res.ok) throw new Error(`sent-log ${res.status}`);
		({ sent } = (await res.json()) as { sent: SentRecord[] });
	} catch (err) {
		logger.warn("fetchWebhookSends: sms-mcp unreachable; skipping", {
			runId: run.id,
			error: err instanceof Error ? err.message : String(err),
		});
		return [];
	}

	const callEnd = run.completedAt ? run.completedAt.getTime() : null;

	return sent
		.map((s) => {
			const at = new Date(s.createdAt).getTime();
			return {
				id: s.id,
				from: run.targetLabel,
				to: s.to,
				body: s.body,
				channel: "sms",
				// Canonical direction is the tester's perspective: a text the
				// bot-under-test sent is one we *received*, so "inbound" — matching
				// correlateSms (Dial path). The judge counts inbound SMS as evidence
				// the bot texted, so this must agree or received_sms/sms_content fail.
				direction: "inbound",
				createdAt: s.createdAt,
				secondsFromCallEnd:
					callEnd === null ? null : Math.round((at - callEnd) / 1000),
			} satisfies CorrelatedMessage;
		})
		.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
};
