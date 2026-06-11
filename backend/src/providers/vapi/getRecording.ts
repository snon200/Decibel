import { vapiRequest } from "./client.ts";
import { recordingUrlFrom } from "./mapCall.ts";
import type { VapiCall } from "./mapCall.ts";

export const getVapiRecordingUrl = async (input: {
	externalCallId: string;
}): Promise<string | null> => {
	const call = await vapiRequest<VapiCall>({
		path: `/call/${input.externalCallId}`,
	});
	return recordingUrlFrom(call);
};
