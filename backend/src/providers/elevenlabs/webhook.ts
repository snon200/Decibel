import crypto from "node:crypto";
import { config } from "../../config/env.ts";
import { flattenTranscript, mapElevenStatus } from "./mapCall.ts";
import type { ElevenTranscriptTurn } from "./mapCall.ts";
import type { NormalizedCallEvent, WebhookInput } from "../types.ts";

export const verifyElevenWebhook = (input: WebhookInput): boolean => {
	const secret = config.ELEVENLABS_WEBHOOK_SECRET;
	if (!secret) return false;

	const header = input.headers["elevenlabs-signature"];
	if (!header) return false;

	const parts = Object.fromEntries(
		header.split(",").map((part) => {
			const [key, value] = part.split("=");
			return [key ?? "", value ?? ""];
		}),
	) as Record<string, string>;

	const timestamp = parts["t"];
	const signature = parts["v0"];
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

	// ElevenLabs allows a 30-minute timestamp tolerance.
	const fresh = Math.abs(Date.now() / 1000 - Number(timestamp)) < 30 * 60;
	return signatureMatches && fresh;
};

interface ElevenWebhookEnvelope {
	type?: string;
	data?: {
		conversation_id?: string;
		status?: string;
		transcript?: ElevenTranscriptTurn[] | null;
		metadata?: { call_duration_secs?: number | null } | null;
	};
}

export const parseElevenWebhookEvent = (
	input: WebhookInput,
): NormalizedCallEvent | null => {
	const envelope = JSON.parse(input.rawBody) as ElevenWebhookEnvelope;
	const data = envelope.data;
	if (!data?.conversation_id) return null;

	if (envelope.type === "post_call_transcription") {
		return {
			externalCallId: data.conversation_id,
			type: "ended",
			status: mapElevenStatus(data.status),
			durationSeconds: data.metadata?.call_duration_secs ?? null,
			transcriptAvailable: flattenTranscript(data.transcript) !== null,
			raw: envelope,
		};
	}

	return null;
};
