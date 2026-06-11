import { placeElevenCall } from "./placeCall.ts";
import { getElevenCall } from "./getCall.ts";
import { getElevenRecordingUrl } from "./getRecording.ts";
import { configureElevenInbound, listElevenNumbers } from "./numbers.ts";
import { VoiceProvider } from "../types.ts";
import type {
	ConfigureInboundInput,
	NormalizedCall,
	NormalizedNumber,
	PlaceCallInput,
	ProviderName,
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

	listNumbers(): Promise<NormalizedNumber[]> {
		return listElevenNumbers();
	}

	configureInboundNumber(
		input: ConfigureInboundInput,
	): Promise<NormalizedNumber> {
		return configureElevenInbound(input);
	}
}
