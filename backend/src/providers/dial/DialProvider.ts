import { placeDialCall } from "./placeCall.ts";
import { getDialCall } from "./getCall.ts";
import { getDialRecordingUrl } from "./getRecording.ts";
import { parseDialWebhookEvent, verifyDialWebhook } from "./webhook.ts";
import { VoiceProvider } from "../types.ts";
import type {
	NormalizedCall,
	NormalizedCallEvent,
	PlaceCallInput,
	ProviderName,
	WebhookInput,
} from "../types.ts";

export class DialProvider extends VoiceProvider {
	readonly name: ProviderName = "dial";

	placeCall(input: PlaceCallInput): Promise<NormalizedCall> {
		return placeDialCall(input);
	}

	getCall(input: { externalCallId: string }): Promise<NormalizedCall> {
		return getDialCall(input);
	}

	getRecordingUrl(input: { externalCallId: string }): Promise<string | null> {
		return getDialRecordingUrl(input);
	}

	verifyWebhook(input: WebhookInput): boolean {
		return verifyDialWebhook(input);
	}

	parseWebhookEvent(input: WebhookInput): NormalizedCallEvent | null {
		return parseDialWebhookEvent(input);
	}
}
