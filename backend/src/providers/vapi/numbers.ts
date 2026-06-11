import { config } from "../../config/env.ts";
import { vapiRequest } from "./client.ts";
import { buildVapiAssistant } from "./assistant.ts";
import type { ConfigureInboundInput, NormalizedNumber } from "../types.ts";

interface VapiPhoneNumber {
	id: string;
	number?: string;
	assistantId?: string | null;
	name?: string;
}

const mapVapiNumber = (
	n: VapiPhoneNumber,
	inboundPrompt: string | null = null,
): NormalizedNumber => ({
	id: n.id,
	phoneNumber: n.number ?? null,
	inboundPrompt,
	raw: n,
});

export const listVapiNumbers = async (): Promise<NormalizedNumber[]> => {
	const numbers = await vapiRequest<VapiPhoneNumber[]>({
		path: "/phone-number",
	});
	return numbers.map((n) => mapVapiNumber(n));
};

export const configureVapiInbound = async (
	input: ConfigureInboundInput,
): Promise<NormalizedNumber> => {
	// No prompt → leave the number on whatever assistant/default it already has.
	if (input.systemPrompt === undefined) {
		const current = await vapiRequest<VapiPhoneNumber>({
			path: `/phone-number/${input.numberId}`,
		});
		return mapVapiNumber(current);
	}

	// VAPI binds inbound behavior to a saved assistant. Reuse a configured one
	// when present, otherwise create a dedicated "Agent Under Test" assistant.
	const assistant = buildVapiAssistant({ systemPrompt: input.systemPrompt });
	let assistantId = config.VAPI_ASSISTANT_ID;
	if (assistantId) {
		await vapiRequest({
			path: `/assistant/${assistantId}`,
			method: "PATCH",
			body: assistant,
		});
	} else {
		const created = await vapiRequest<{ id: string }>({
			path: "/assistant",
			method: "POST",
			body: { name: "Agent Under Test", ...assistant },
		});
		assistantId = created.id;
	}

	const updated = await vapiRequest<VapiPhoneNumber>({
		path: `/phone-number/${input.numberId}`,
		method: "PATCH",
		body: { assistantId },
	});
	return mapVapiNumber(updated, input.systemPrompt);
};
