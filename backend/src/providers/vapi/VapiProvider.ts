import { placeVapiCall } from "./placeCall.ts";
import { getVapiCall } from "./getCall.ts";
import { getVapiRecordingUrl } from "./getRecording.ts";
import { parseVapiWebhookEvent, verifyVapiWebhook } from "./webhook.ts";
import { VoiceProvider } from "../types.ts";
import type {
	NormalizedCall,
	NormalizedCallEvent,
	PlaceCallInput,
	ProviderName,
	WebhookInput,
} from "../types.ts";

export class VapiProvider extends VoiceProvider {
	readonly name: ProviderName = "vapi";

	placeCall(input: PlaceCallInput): Promise<NormalizedCall> {
		return placeVapiCall(input);
	}

	getCall(input: { externalCallId: string }): Promise<NormalizedCall> {
		return getVapiCall(input);
	}

	getRecordingUrl(input: { externalCallId: string }): Promise<string | null> {
		return getVapiRecordingUrl(input);
	}

	verifyWebhook(input: WebhookInput): boolean {
		return verifyVapiWebhook(input);
	}

	parseWebhookEvent(input: WebhookInput): NormalizedCallEvent | null {
		return parseVapiWebhookEvent(input);
	}
}
