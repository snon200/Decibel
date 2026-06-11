import { vapiRequest } from "./client.ts";
import { mapVapiCall } from "./mapCall.ts";
import type { VapiCall } from "./mapCall.ts";
import type { NormalizedCall } from "../types.ts";

export const getVapiCall = async (input: {
	externalCallId: string;
}): Promise<NormalizedCall> => {
	const call = await vapiRequest<VapiCall>({
		path: `/call/${input.externalCallId}`,
	});
	return mapVapiCall(call);
};
