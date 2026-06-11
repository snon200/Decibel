import { dialRequest } from "./client.ts";

/**
 * Undocumented but live: `GET /api/v1/calls/{id}/recording` returns a short-lived
 * signed URL to the call's WAV. Verified against a real call during research.
 */
export const getDialRecordingUrl = async (input: {
	externalCallId: string;
}): Promise<string | null> => {
	const result = await dialRequest<{ url?: string }>({
		path: `/api/v1/calls/${input.externalCallId}/recording`,
	});
	return result.url ?? null;
};
