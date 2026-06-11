import { getProvider } from "../../providers/registry.ts";
import type { NormalizedNumber, ProviderName } from "../../providers/types.ts";

/**
 * Host an Agent-Under-Test on a provider number for inbound competitor tests.
 *
 * Pass `systemPrompt` to make the number answer with that exact prompt (the same
 * prompt we run on Dial), or omit it to leave the number on its provider-defined
 * default behavior.
 */
export const hostInboundAgent = (input: {
	platform: ProviderName;
	numberId: string;
	systemPrompt?: string;
}): Promise<NormalizedNumber> => {
	const provider = getProvider(input.platform);
	const args =
		input.systemPrompt === undefined
			? { numberId: input.numberId }
			: { numberId: input.numberId, systemPrompt: input.systemPrompt };
	return provider.configureInboundNumber(args);
};

/** List the numbers available on a platform (to pick an inbound test target). */
export const listPlatformNumbers = (
	platform: ProviderName,
): Promise<NormalizedNumber[]> => {
	return getProvider(platform).listNumbers();
};
