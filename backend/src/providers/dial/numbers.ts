import { dialRequest } from "./client.ts";
import type { ConfigureInboundInput, NormalizedNumber } from "../types.ts";

interface DialNumber {
	id: string;
	number?: string;
	nickname?: string | null;
	country?: string;
	inboundInstruction?: string | null;
}

const mapDialNumber = (n: DialNumber): NormalizedNumber => ({
	id: n.id,
	phoneNumber: n.number ?? null,
	inboundPrompt: n.inboundInstruction ?? null,
	raw: n,
});

export const listDialNumbers = async (): Promise<NormalizedNumber[]> => {
	const { numbers } = await dialRequest<{ numbers: DialNumber[] }>({
		path: "/api/v1/numbers",
	});
	return numbers.map(mapDialNumber);
};

export const configureDialInbound = async (
	input: ConfigureInboundInput,
): Promise<NormalizedNumber> => {
	// No prompt → don't touch the number; it keeps its default inbound instruction.
	if (input.systemPrompt === undefined) {
		const { number } = await dialRequest<{ number: DialNumber }>({
			path: `/api/v1/numbers/${input.numberId}`,
		});
		return mapDialNumber(number);
	}

	const { number } = await dialRequest<{ number: DialNumber }>({
		path: `/api/v1/numbers/${input.numberId}`,
		method: "PATCH",
		body: { inboundInstruction: input.systemPrompt },
	});
	return mapDialNumber(number);
};
