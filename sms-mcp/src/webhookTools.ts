import type { Request, Response } from "express";
import { config } from "./config.ts";
import { resolveFromNumberId, sendSms } from "./dialClient.ts";
import { createCheckoutSession } from "./stripeClient.ts";
import { appendSent } from "./sentLog.ts";

/**
 * Plain HTTP webhook tools for voice agents that aren't on Dial (e.g. an
 * ElevenLabs agent-under-test). Unlike the MCP path — which reads the caller
 * from Dial's `X-Dial-*` headers — these take the recipient explicitly, so the
 * agent can pass `{{system__caller_id}}` via the `X-Caller-Id` header.
 *
 * Every send is recorded in the self-log (the backend's evidence source) even
 * if the real Dial delivery fails, because for cross-platform tests the caller
 * is our own Dial tester number and a real text may loop back — the *intent*
 * to text is what the judge scores.
 */

/** A usable value = present, a string, and not an unsubstituted `{{var}}`. */
const usable = (v: unknown): string | undefined =>
	typeof v === "string" && v.length > 0 && !v.startsWith("{{") ? v : undefined;

const callerId = (req: Request): string | undefined =>
	usable(req.header("X-Caller-Id")) ?? usable((req.body as { to?: unknown })?.to);

const conversationId = (req: Request): string | undefined =>
	usable(req.header("X-Conversation-Id")) ??
	usable((req.body as { conversation_id?: unknown })?.conversation_id);

/** Best-effort real delivery via Dial. Never throws — caller still self-logs. */
const tryDialSend = async (to: string, body: string): Promise<boolean> => {
	try {
		const fromNumberId =
			config.SMS_FROM_NUMBER_ID || (await resolveFromNumberId(undefined));
		await sendSms({ to, fromNumberId, body });
		return true;
	} catch (err) {
		console.warn(
			`webhook: Dial send failed (continuing, self-logged): ${err instanceof Error ? err.message : String(err)}`,
		);
		return false;
	}
};

export const handleSmsWebhook = async (
	req: Request,
	res: Response,
): Promise<void> => {
	const to = callerId(req);
	const body = (req.body as { message?: unknown; body?: unknown })?.message ??
		(req.body as { body?: unknown })?.body;
	if (!to) {
		res.status(400).json({ ok: false, error: "no recipient (X-Caller-Id)" });
		return;
	}
	if (typeof body !== "string" || body.length === 0) {
		res.status(400).json({ ok: false, error: "missing `message`" });
		return;
	}
	const delivered = await tryDialSend(to, body);
	appendSent({
		kind: "sms",
		to,
		body,
		delivered,
		...(conversationId(req) ? { conversationId: conversationId(req)! } : {}),
	});
	res.json({ ok: true, message: `Text sent to the caller.` });
};

export const handlePaymentWebhook = async (
	req: Request,
	res: Response,
): Promise<void> => {
	const to = callerId(req);
	const b = req.body as { description?: unknown; amount_usd?: unknown };
	const description =
		typeof b?.description === "string" && b.description.length > 0
			? b.description
			: "Payment";
	const amountUsd = typeof b?.amount_usd === "number" ? b.amount_usd : 1;
	if (!to) {
		res.status(400).json({ ok: false, error: "no recipient (X-Caller-Id)" });
		return;
	}
	try {
		const amountCents = Math.max(50, Math.round(amountUsd * 100));
		const session = await createCheckoutSession({ amountCents, description });
		const body = `Here's your secure payment link for ${description} ($${(amountCents / 100).toFixed(2)}): ${session.url}`;
		const delivered = await tryDialSend(to, body);
		appendSent({
			kind: "payment",
			to,
			body,
			paymentUrl: session.url,
			delivered,
			...(conversationId(req) ? { conversationId: conversationId(req)! } : {}),
		});
		res.json({ ok: true, message: `Payment link texted to the caller.` });
	} catch (err) {
		res.status(500).json({
			ok: false,
			error: `payment failed: ${err instanceof Error ? err.message : String(err)}`,
		});
	}
};
