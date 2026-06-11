import { config } from "../../config/env.ts";
import { elevenRequest } from "./client.ts";
import { buildAgentConversationConfig } from "./agent.ts";
import type { ConfigureInboundInput, NormalizedNumber } from "../types.ts";

interface ElevenPhoneNumber {
	phone_number_id: string;
	phone_number?: string;
	label?: string | null;
	assigned_agent?: { agent_id?: string } | null;
}

const mapElevenNumber = (
	n: ElevenPhoneNumber,
	inboundPrompt: string | null = null,
): NormalizedNumber => ({
	id: n.phone_number_id,
	phoneNumber: n.phone_number ?? null,
	inboundPrompt,
	raw: n,
});

export const listElevenNumbers = async (): Promise<NormalizedNumber[]> => {
	const numbers = await elevenRequest<ElevenPhoneNumber[]>({
		path: "/v1/convai/phone-numbers",
	});
	return numbers.map((n) => mapElevenNumber(n));
};

export const configureElevenInbound = async (
	input: ConfigureInboundInput,
): Promise<NormalizedNumber> => {
	// No prompt → leave the number on its currently-assigned agent / default.
	if (input.systemPrompt === undefined) {
		const current = await elevenRequest<ElevenPhoneNumber>({
			path: `/v1/convai/phone-numbers/${input.numberId}`,
		});
		return mapElevenNumber(current);
	}

	// ElevenLabs binds inbound behavior to an assigned agent. Reuse a configured
	// agent (patch its prompt) or create a dedicated "Agent Under Test".
	const agentConfig = buildAgentConversationConfig({
		systemPrompt: input.systemPrompt,
	});
	let agentId = config.ELEVENLABS_AGENT_ID;
	if (agentId) {
		await elevenRequest({
			path: `/v1/convai/agents/${agentId}`,
			method: "PATCH",
			body: agentConfig,
		});
	} else {
		const created = await elevenRequest<{ agent_id: string }>({
			path: "/v1/convai/agents/create",
			method: "POST",
			body: { name: "Agent Under Test", ...agentConfig },
		});
		agentId = created.agent_id;
	}

	const updated = await elevenRequest<ElevenPhoneNumber>({
		path: `/v1/convai/phone-numbers/${input.numberId}`,
		method: "PATCH",
		body: { agent_id: agentId },
	});
	return mapElevenNumber(updated, input.systemPrompt);
};
