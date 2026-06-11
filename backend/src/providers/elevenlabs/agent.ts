// Per-call override injected via `conversation_initiation_client_data` so the
// same Agent-Under-Test prompt runs without mutating the saved agent.
export const buildConversationOverride = (input: {
	systemPrompt: string;
	language?: string;
}): Record<string, unknown> => {
	const agent: Record<string, unknown> = {
		prompt: { prompt: input.systemPrompt },
	};
	if (input.language) agent["language"] = input.language;
	return { conversation_config_override: { agent } };
};

// Saved-agent config shape for create/update — used when hosting an inbound AUT.
export const buildAgentConversationConfig = (input: {
	systemPrompt: string;
}): Record<string, unknown> => ({
	conversation_config: {
		agent: { prompt: { prompt: input.systemPrompt } },
	},
});
