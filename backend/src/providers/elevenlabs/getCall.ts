import { elevenRequest } from "./client.ts";
import { mapElevenCall } from "./mapCall.ts";
import type { ElevenConversation } from "./mapCall.ts";
import type { NormalizedCall } from "../types.ts";

export const getElevenCall = async (input: {
	externalCallId: string;
}): Promise<NormalizedCall> => {
	const conv = await elevenRequest<ElevenConversation>({
		path: `/v1/convai/conversations/${input.externalCallId}`,
	});
	return mapElevenCall(conv);
};
