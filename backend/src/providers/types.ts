export type ProviderName = "dial" | "vapi";

export type CallStatus =
	| "queued"
	| "ringing"
	| "in_progress"
	| "completed"
	| "no_answer"
	| "busy"
	| "failed"
	| "canceled";

export const TERMINAL_STATUSES: ReadonlySet<CallStatus> = new Set<CallStatus>([
	"completed",
	"no_answer",
	"busy",
	"failed",
	"canceled",
]);

export interface PlaceCallInput {
	/** Destination phone number, E.164. */
	to: string;
	/** Provider number id to call from; falls back to provider config when omitted. */
	from?: string;
	/** Outbound system prompt the AI voice agent runs with. */
	systemPrompt: string;
	/** BCP-47 language tag; omit to let the provider auto-detect. */
	language?: string;
	idempotencyKey?: string;
	/** Where the provider should POST call results, when it supports per-call URLs. */
	webhookUrl?: string;
}

export interface NormalizedCall {
	externalCallId: string;
	status: CallStatus;
	durationSeconds: number | null;
	transcript: string | null;
	recordingAvailable: boolean;
	raw: unknown;
}

export type CallEventType = "ended" | "transcribed";

export interface NormalizedCallEvent {
	externalCallId: string;
	type: CallEventType;
	status: CallStatus | null;
	durationSeconds: number | null;
	transcriptAvailable: boolean;
	raw: unknown;
}

export interface WebhookInput {
	rawBody: string;
	headers: Record<string, string | undefined>;
}

/**
 * The single contract every voice platform hides behind. Business logic (the
 * generic `Run`) only ever talks to this — never a vendor SDK directly.
 */
export abstract class VoiceProvider {
	abstract readonly name: ProviderName;

	abstract placeCall(input: PlaceCallInput): Promise<NormalizedCall>;

	abstract getCall(input: { externalCallId: string }): Promise<NormalizedCall>;

	/** Signed/short-lived URL to the call audio, or null if none is available. */
	abstract getRecordingUrl(input: { externalCallId: string }): Promise<string | null>;

	abstract verifyWebhook(input: WebhookInput): boolean;

	abstract parseWebhookEvent(input: WebhookInput): NormalizedCallEvent | null;
}
