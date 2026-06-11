import { TERMINAL_STATUSES } from "../../providers/types.ts";
import type {
	CallStatus,
	NormalizedCall,
	PlaceCallInput,
	VoiceProvider,
} from "../../providers/types.ts";

export interface RunSummary {
	provider: string;
	externalCallId: string | null;
	status: CallStatus;
	durationSeconds: number | null;
	transcript: string | null;
	recordingAvailable: boolean;
}

const delay = (ms: number): Promise<void> =>
	new Promise((resolve) => setTimeout(resolve, ms));

/**
 * A single test call executed through any {@link VoiceProvider}. Generic over
 * the provider — Dial, VAPI, or any future adapter plug in unchanged. Holds the
 * normalized call state and converges by polling the provider ({@link refresh}).
 */
export class Run {
	readonly provider: VoiceProvider;
	readonly input: PlaceCallInput;

	externalCallId: string | null = null;
	status: CallStatus = "queued";
	durationSeconds: number | null = null;
	transcript: string | null = null;
	recordingAvailable = false;

	constructor(args: { provider: VoiceProvider; input: PlaceCallInput }) {
		this.provider = args.provider;
		this.input = args.input;
	}

	get isTerminal(): boolean {
		return TERMINAL_STATUSES.has(this.status);
	}

	/** Place the outbound call and capture the initial state. */
	async start(): Promise<this> {
		const call = await this.provider.placeCall(this.input);
		this.apply(call);
		return this;
	}

	/** Polling path: re-read the call from the provider. */
	async refresh(): Promise<this> {
		const call = await this.provider.getCall({
			externalCallId: this.requireCallId(),
		});
		this.apply(call);
		return this;
	}

	async getRecordingUrl(): Promise<string | null> {
		if (!this.externalCallId || !this.recordingAvailable) return null;
		return this.provider.getRecordingUrl({ externalCallId: this.externalCallId });
	}

	/** Convenience for scripts/jobs: poll until the call reaches a terminal status. */
	async waitUntilTerminal(options?: {
		pollMs?: number;
		timeoutMs?: number;
	}): Promise<this> {
		const pollMs = options?.pollMs ?? 4000;
		const timeoutMs = options?.timeoutMs ?? 5 * 60 * 1000;
		const deadline = Date.now() + timeoutMs;
		while (!this.isTerminal && Date.now() < deadline) {
			await delay(pollMs);
			await this.refresh();
		}
		return this;
	}

	get summary(): RunSummary {
		return {
			provider: this.provider.name,
			externalCallId: this.externalCallId,
			status: this.status,
			durationSeconds: this.durationSeconds,
			transcript: this.transcript,
			recordingAvailable: this.recordingAvailable,
		};
	}

	private apply(call: NormalizedCall): void {
		this.externalCallId = call.externalCallId;
		this.status = call.status;
		this.durationSeconds = call.durationSeconds;
		if (call.transcript !== null) this.transcript = call.transcript;
		this.recordingAvailable = call.recordingAvailable;
	}

	private requireCallId(): string {
		if (!this.externalCallId) {
			throw new Error("Run has not been started yet (no externalCallId)");
		}
		return this.externalCallId;
	}
}
