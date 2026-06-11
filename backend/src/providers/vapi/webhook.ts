import { config } from "../../config/env.ts";
import { mapVapiCall, mapVapiStatus } from "./mapCall.ts";
import type { VapiArtifact, VapiCall } from "./mapCall.ts";
import type { NormalizedCallEvent, WebhookInput } from "../types.ts";

export const verifyVapiWebhook = (input: WebhookInput): boolean => {
	const secret = config.VAPI_WEBHOOK_SECRET;
	if (!secret) return false;
	return input.headers["x-vapi-secret"] === secret;
};

interface VapiWebhookEnvelope {
	message?: {
		type?: string;
		status?: string;
		endedReason?: string;
		call?: VapiCall;
		artifact?: VapiArtifact;
	};
}

export const parseVapiWebhookEvent = (
	input: WebhookInput,
): NormalizedCallEvent | null => {
	const envelope = JSON.parse(input.rawBody) as VapiWebhookEnvelope;
	const message = envelope.message;
	const call = message?.call;
	if (!message || !call?.id) return null;

	if (message.type === "end-of-call-report") {
		const merged: VapiCall = { ...call, status: "ended" };
		if (message.endedReason) merged.endedReason = message.endedReason;
		if (message.artifact) merged.artifact = message.artifact;

		const normalized = mapVapiCall(merged);
		return {
			externalCallId: call.id,
			type: "ended",
			status: normalized.status,
			durationSeconds: normalized.durationSeconds,
			transcriptAvailable: normalized.transcript !== null,
			raw: envelope,
		};
	}

	if (message.type === "status-update" && message.status === "ended") {
		const ended: VapiCall = { ...call, status: "ended" };
		if (message.endedReason) ended.endedReason = message.endedReason;
		return {
			externalCallId: call.id,
			type: "ended",
			status: mapVapiStatus(ended),
			durationSeconds: null,
			transcriptAvailable: false,
			raw: envelope,
		};
	}

	return null;
};
