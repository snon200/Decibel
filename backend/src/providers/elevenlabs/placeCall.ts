import { config } from "../../config/env.ts";
import { elevenRequest } from "./client.ts";
import { buildConversationOverride } from "./agent.ts";
import type { NormalizedCall, PlaceCallInput } from "../types.ts";

interface OutboundCallResponse {
	success: boolean;
	message: string;
	conversation_id: string | null;
	callSid: string | null;
}

export const placeElevenCall = async (
	input: PlaceCallInput,
): Promise<NormalizedCall> => {
	const agentId = config.ELEVENLABS_AGENT_ID;
	const phoneNumberId = input.from ?? config.ELEVENLABS_PHONE_NUMBER_ID;
	if (!agentId) {
		throw new Error("ElevenLabs requires an agentId (set ELEVENLABS_AGENT_ID)");
	}
	if (!phoneNumberId) {
		throw new Error(
			"ElevenLabs requires a phoneNumberId (set ELEVENLABS_PHONE_NUMBER_ID)",
		);
	}

	// Inject the AUT prompt per-call so the saved agent stays untouched.
	const override = buildConversationOverride(
		input.language
			? { systemPrompt: input.systemPrompt, language: input.language }
			: { systemPrompt: input.systemPrompt },
	);

	const body = {
		agent_id: agentId,
		agent_phone_number_id: phoneNumberId,
		to_number: input.to,
		conversation_initiation_client_data: override,
	};

	const result = await elevenRequest<OutboundCallResponse>({
		path: "/v1/convai/twilio/outbound-call",
		method: "POST",
		body,
	});

	if (!result.conversation_id) {
		throw new Error(`ElevenLabs outbound call failed: ${result.message}`);
	}

	// The outbound response carries no call detail; return an initial snapshot
	// and let the Run converge via polling like the other providers.
	return {
		externalCallId: result.conversation_id,
		status: "queued",
		durationSeconds: null,
		transcript: null,
		recordingAvailable: false,
		raw: result,
	};
};
