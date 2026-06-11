import { DialProvider } from "./dial/DialProvider.ts";
import { VapiProvider } from "./vapi/VapiProvider.ts";
import { ElevenLabsProvider } from "./elevenlabs/ElevenLabsProvider.ts";
import type { ProviderName, VoiceProvider } from "./types.ts";

export const getProvider = (name: ProviderName): VoiceProvider => {
	switch (name) {
		case "dial":
			return new DialProvider();
		case "vapi":
			return new VapiProvider();
		case "elevenlabs":
			return new ElevenLabsProvider();
	}
};
