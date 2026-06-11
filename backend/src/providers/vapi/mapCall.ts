import type { CallStatus, NormalizedCall } from "../types.ts";

interface VapiRecording {
	mono?: { url?: string } | string;
	stereoUrl?: string;
	url?: string;
}

export interface VapiArtifact {
	transcript?: string | null;
	recording?: VapiRecording | null;
	recordingUrl?: string | null;
	stereoRecordingUrl?: string | null;
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

export const recordingUrlFrom = (call: VapiCall): string | null => {
	const artifact = call.artifact;
	if (!artifact) return null;
	if (artifact.stereoRecordingUrl) return artifact.stereoRecordingUrl;
	if (artifact.recordingUrl) return artifact.recordingUrl;

	const recording = artifact.recording;
	if (!recording) return null;
	if (recording.stereoUrl) return recording.stereoUrl;
	if (recording.url) return recording.url;
	if (recording.mono) {
		return typeof recording.mono === "string"
			? recording.mono
			: (recording.mono.url ?? null);
	}
	return null;
};

export const mapVapiCall = (call: VapiCall): NormalizedCall => ({
	externalCallId: call.id,
	status: mapVapiStatus(call),
	durationSeconds: durationFrom(call),
	transcript: call.artifact?.transcript ?? null,
	recordingAvailable: recordingUrlFrom(call) !== null,
	raw: call,
});
