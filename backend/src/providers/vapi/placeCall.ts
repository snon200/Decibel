import { config } from "../../config/env.ts";
import { vapiRequest } from "./client.ts";
import { buildVapiAssistant } from "./assistant.ts";
import { mapVapiCall } from "./mapCall.ts";
import type { VapiCall } from "./mapCall.ts";
import type { NormalizedCall, PlaceCallInput } from "../types.ts";

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
		assistant: buildVapiAssistant({ systemPrompt: input.systemPrompt }),
	};

	const call = await vapiRequest<VapiCall>({
		path: "/call",
		method: "POST",
		body,
	});
	return mapVapiCall(call);
};
