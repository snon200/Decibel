import { placeDialCall } from "./placeCall.ts";
import { getDialCall } from "./getCall.ts";
import { getDialRecordingUrl } from "./getRecording.ts";
import { listDialMessages } from "./getMessages.ts";
import { configureDialInbound, listDialNumbers } from "./numbers.ts";
import { VoiceProvider } from "../types.ts";
import type {
	ConfigureInboundInput,
	ListMessagesInput,
	NormalizedCall,
	NormalizedMessage,
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

	/** Dial-specific: SMS isn't part of the cross-provider VoiceProvider contract. */
	listMessages(input?: ListMessagesInput): Promise<NormalizedMessage[]> {
		return listDialMessages(input);
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
