import crypto from "node:crypto";
import { config } from "../../config/env.ts";
import { mapDialStatus } from "./mapCall.ts";
import type { NormalizedCallEvent, WebhookInput } from "../types.ts";

export const verifyDialWebhook = (input: WebhookInput): boolean => {
	const secret = config.DIAL_WEBHOOK_SECRET;
	if (!secret) return false;

	const header = input.headers["x-dial-signature"];
	if (!header) return false;

	const parts = Object.fromEntries(
		header.split(",").map((part) => {
			const [key, value] = part.split("=");
			return [key ?? "", value ?? ""];
		}),
	) as Record<string, string>;

	const timestamp = parts["t"];
	const signature = parts["v1"];
	if (!timestamp || !signature) return false;

	const expected = crypto
		.createHmac("sha256", secret)
		.update(`${timestamp}.${input.rawBody}`)
		.digest("hex");

	let signatureMatches = false;
	try {
		signatureMatches = crypto.timingSafeEqual(
			Buffer.from(signature, "hex"),
			Buffer.from(expected, "hex"),
		);
	} catch {
		return false;
	}

	const fresh = Math.abs(Date.now() / 1000 - Number(timestamp)) < 300;
	return signatureMatches && fresh;
};

interface DialWebhookEnvelope {
	type?: string;
	data?: {
		callId?: string;
		status?: string;
		durationSeconds?: number | null;
		transcriptAvailable?: boolean;
	};
}

export const parseDialWebhookEvent = (
	input: WebhookInput,
): NormalizedCallEvent | null => {
	const envelope = JSON.parse(input.rawBody) as DialWebhookEnvelope;
	const data = envelope.data;
	if (!data?.callId) return null;

	if (envelope.type === "call.ended") {
		return {
			externalCallId: data.callId,
			type: "ended",
			status: data.status ? mapDialStatus(data.status) : null,
			durationSeconds: data.durationSeconds ?? null,
			transcriptAvailable: data.transcriptAvailable ?? false,
			raw: envelope,
		};
	}

	if (envelope.type === "call.transcribed") {
		return {
			externalCallId: data.callId,
			type: "transcribed",
			status: null,
			durationSeconds: null,
			transcriptAvailable: true,
			raw: envelope,
		};
	}

	return null;
};
