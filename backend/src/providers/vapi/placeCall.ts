import { config } from "../../config/env.ts";
import { vapiRequest } from "./client.ts";
import { mapVapiCall } from "./mapCall.ts";
import type { VapiCall } from "./mapCall.ts";
import type { NormalizedCall, PlaceCallInput } from "../types.ts";

// VAPI needs a fully-specified transient assistant; these are sensible defaults
// so the same system prompt can run unchanged across providers.
const buildAssistant = (input: PlaceCallInput): Record<string, unknown> => {
	const assistant: Record<string, unknown> = {
		firstMessageMode: "assistant-speaks-first",
		model: {
			provider: "openai",
			model: "gpt-4o",
			messages: [{ role: "system", content: input.systemPrompt }],
		},
		voice: { provider: "vapi", voiceId: "Elliot" },
		transcriber: { provider: "deepgram", model: "nova-2" },
		artifactPlan: { recordingEnabled: true },
		serverMessages: ["end-of-call-report", "status-update"],
	};
	if (input.webhookUrl) {
		assistant["server"] = { url: input.webhookUrl };
	}
	return assistant;
};

export const placeVapiCall = async (
	input: PlaceCallInput,
): Promise<NormalizedCall> => {
	const phoneNumberId = input.from ?? config.VAPI_PHONE_NUMBER_ID;
	if (!phoneNumberId) {
		throw new Error("VAPI requires a phoneNumberId (set VAPI_PHONE_NUMBER_ID)");
	}

	const body = {
		phoneNumberId,
		customer: { number: input.to },
		assistant: buildAssistant(input),
	};

	const call = await vapiRequest<VapiCall>({
		path: "/call",
		method: "POST",
		body,
	});
	return mapVapiCall(call);
};
