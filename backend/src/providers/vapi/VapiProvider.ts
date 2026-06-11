import { placeVapiCall } from "./placeCall.ts";
import { getVapiCall } from "./getCall.ts";
import { getVapiRecordingUrl } from "./getRecording.ts";
import { configureVapiInbound, listVapiNumbers } from "./numbers.ts";
import { VoiceProvider } from "../types.ts";
import type {
	ConfigureInboundInput,
	NormalizedCall,
	NormalizedNumber,
	PlaceCallInput,
	ProviderName,
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

	listNumbers(): Promise<NormalizedNumber[]> {
		return listVapiNumbers();
	}

	configureInboundNumber(
		input: ConfigureInboundInput,
	): Promise<NormalizedNumber> {
		return configureVapiInbound(input);
	}
}
