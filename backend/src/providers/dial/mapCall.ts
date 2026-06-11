import type { CallStatus, NormalizedCall } from "../types.ts";

export interface DialStatusObject {
	state?: string | null;
	terminationType?: string | null;
	label?: string | null;
}

export interface DialCall {
	id: string;
	status: string | DialStatusObject;
	duration?: number | null;
	transcript?: string | null;
	recordingAvailable?: boolean;
}

const mapTermination = (value: string): CallStatus => {
	switch (value.toLowerCase()) {
		case "completed":
			return "completed";
		case "no-answer":
		case "no_answer":
			return "no_answer";
		case "busy":
			return "busy";
		case "canceled":
		case "cancelled":
			return "canceled";
		default:
			return "failed";
	}
};

export const mapDialStatus = (status: string | DialStatusObject): CallStatus => {
	if (typeof status === "string") {
		return mapTermination(status);
	}
	if (status.terminationType) {
		return mapTermination(status.terminationType);
	}
	switch ((status.state ?? "").toLowerCase()) {
		case "queued":
			return "queued";
		case "ringing":
		case "registered":
			return "ringing";
		case "terminated":
			return "completed";
		default:
			return "in_progress";
	}
};

export const mapDialCall = (call: DialCall): NormalizedCall => ({
	externalCallId: call.id,
	status: mapDialStatus(call.status),
	durationSeconds: call.duration ?? null,
	transcript: call.transcript ?? null,
	recordingAvailable: call.recordingAvailable ?? false,
	raw: call,
});
