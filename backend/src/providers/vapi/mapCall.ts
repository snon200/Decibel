import type { CallStatus, NormalizedCall } from "../types.ts";

export interface VapiArtifact {
	transcript?: string | null;
}

export interface VapiCall {
	id: string;
	status?: string;
	endedReason?: string;
	artifact?: VapiArtifact | null;
	startedAt?: string;
	endedAt?: string;
}

const mapEndedReason = (reason: string | undefined): CallStatus => {
	const value = (reason ?? "").toLowerCase();
	if (value.includes("did-not-answer") || value.includes("no-answer")) {
		return "no_answer";
	}
	if (value.includes("busy")) return "busy";
	if (value.includes("cancel")) return "canceled";
	if (value.includes("error") || value.includes("fail")) return "failed";
	return "completed";
};

export const mapVapiStatus = (call: VapiCall): CallStatus => {
	switch ((call.status ?? "").toLowerCase()) {
		case "scheduled":
		case "queued":
			return "queued";
		case "ringing":
			return "ringing";
		case "in-progress":
		case "forwarding":
			return "in_progress";
		case "ended":
			return mapEndedReason(call.endedReason);
		default:
			return "in_progress";
	}
};

const durationFrom = (call: VapiCall): number | null => {
	if (!call.startedAt || !call.endedAt) return null;
	const ms = new Date(call.endedAt).getTime() - new Date(call.startedAt).getTime();
	return Number.isFinite(ms) ? Math.round(ms / 1000) : null;
};

export const mapVapiCall = (call: VapiCall): NormalizedCall => ({
	externalCallId: call.id,
	status: mapVapiStatus(call),
	durationSeconds: durationFrom(call),
	transcript: call.artifact?.transcript ?? null,
	// Competitor recordings are out of scope — only the tester (Dial) records.
	recordingAvailable: false,
	raw: call,
});
