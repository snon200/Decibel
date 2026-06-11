export type ProviderName = "dial" | "vapi" | "elevenlabs";

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

export interface NormalizedNumber {
	id: string;
	phoneNumber: string | null;
	/** Current inbound system prompt, or null when the number uses its default. */
	inboundPrompt: string | null;
	raw: unknown;
}

export interface ConfigureInboundInput {
	/** Provider number id to (re)configure. */
	numberId: string;
	/**
	 * Inbound system prompt the Agent-Under-Test should answer with. Omit to
	 * leave the number on its provider-defined default behavior.
	 */
	systemPrompt?: string;
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

	/** Numbers owned on this platform, usable for inbound competitor tests. */
	abstract listNumbers(): Promise<NormalizedNumber[]>;

	/**
	 * Point a number's inbound agent at a given system prompt, or leave it on
	 * its default when no prompt is supplied. Used to host the Agent-Under-Test.
	 */
	abstract configureInboundNumber(
		input: ConfigureInboundInput,
	): Promise<NormalizedNumber>;
}
