import { placeElevenCall } from "./placeCall.ts";
import { getElevenCall } from "./getCall.ts";
import { getElevenRecordingUrl } from "./getRecording.ts";
import { parseElevenWebhookEvent, verifyElevenWebhook } from "./webhook.ts";
import { configureElevenInbound, listElevenNumbers } from "./numbers.ts";
import { VoiceProvider } from "../types.ts";
import type {
	ConfigureInboundInput,
	NormalizedCall,
	NormalizedCallEvent,
	NormalizedNumber,
	PlaceCallInput,
	ProviderName,
	WebhookInput,
} from "../types.ts";

export class ElevenLabsProvider extends VoiceProvider {
	readonly name: ProviderName = "elevenlabs";

	placeCall(input: PlaceCallInput): Promise<NormalizedCall> {
		return placeElevenCall(input);
	}

	getCall(input: { externalCallId: string }): Promise<NormalizedCall> {
		return getElevenCall(input);
	}

	getRecordingUrl(input: { externalCallId: string }): Promise<string | null> {
		return getElevenRecordingUrl(input);
	}

	verifyWebhook(input: WebhookInput): boolean {
		return verifyElevenWebhook(input);
	}

	parseWebhookEvent(input: WebhookInput): NormalizedCallEvent | null {
		return parseElevenWebhookEvent(input);
	}

	listNumbers(): Promise<NormalizedNumber[]> {
		return listElevenNumbers();
	}

	configureInboundNumber(
		input: ConfigureInboundInput,
	): Promise<NormalizedNumber> {
		return configureElevenInbound(input);
	}
}
