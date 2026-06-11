import { dialRequest } from "./client.ts";
import { mapDialCall } from "./mapCall.ts";
import type { DialCall } from "./mapCall.ts";
import type { NormalizedCall } from "../types.ts";

export const getDialCall = async (input: {
	externalCallId: string;
}): Promise<NormalizedCall> => {
	const { call } = await dialRequest<{ call: DialCall }>({
		path: `/api/v1/calls/${input.externalCallId}`,
	});
	return mapDialCall(call);
};
