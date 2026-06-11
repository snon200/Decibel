import { placeDialCall } from "./placeCall.ts";
import { getDialCall } from "./getCall.ts";
import { getDialRecordingUrl } from "./getRecording.ts";
import { configureDialInbound, listDialNumbers } from "./numbers.ts";
import { VoiceProvider } from "../types.ts";
import type {
	ConfigureInboundInput,
	NormalizedCall,
	NormalizedNumber,
	PlaceCallInput,
	ProviderName,
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

	listNumbers(): Promise<NormalizedNumber[]> {
		return listDialNumbers();
	}

	configureInboundNumber(
		input: ConfigureInboundInput,
	): Promise<NormalizedNumber> {
		return configureDialInbound(input);
	}
}
