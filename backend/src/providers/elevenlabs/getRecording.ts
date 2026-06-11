/**
 * Competitor recordings are out of scope — only the tester (Dial) needs audio.
 * Always resolves to null.
 */
export const getElevenRecordingUrl = (_input: {
	externalCallId: string;
}): Promise<string | null> => Promise.resolve(null);
