import type { CallStatus, NormalizedCall } from "../types.ts";

export interface ElevenTranscriptTurn {
	role?: string;
	message?: string | null;
	time_in_call_secs?: number;
}

export interface ElevenConversation {
	conversation_id: string;
	status?: string;
	transcript?: ElevenTranscriptTurn[] | null;
	metadata?: { call_duration_secs?: number | null } | null;
}

export const mapElevenStatus = (status: string | undefined): CallStatus => {
	switch ((status ?? "").toLowerCase()) {
		case "initiated":
			return "queued";
		case "in-progress":
		case "in_progress":
			return "in_progress";
		// "processing" = call ended, transcript still being assembled.
		case "processing":
			return "in_progress";
		case "done":
			return "completed";
		case "failed":
			return "failed";
		default:
			return "in_progress";
	}
};

export const flattenTranscript = (
	turns: ElevenTranscriptTurn[] | null | undefined,
): string | null => {
	if (!turns || turns.length === 0) return null;
	const lines = turns
		.filter((turn) => turn.message)
		.map((turn) => `${turn.role ?? "unknown"}: ${turn.message}`);
	return lines.length > 0 ? lines.join("\n") : null;
};

export const mapElevenCall = (conv: ElevenConversation): NormalizedCall => ({
	externalCallId: conv.conversation_id,
	status: mapElevenStatus(conv.status),
	durationSeconds: conv.metadata?.call_duration_secs ?? null,
	transcript: flattenTranscript(conv.transcript),
	// Competitor recordings are out of scope — only the tester (Dial) records.
	recordingAvailable: false,
	raw: conv,
});
