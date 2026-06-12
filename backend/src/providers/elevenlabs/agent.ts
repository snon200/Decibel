import { buildElevenAgentTools } from "./buildAgentTools.ts";

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
// Attaches the SMS / payment webhook tools so the agent can act mid-call, mirroring
// the Dial Context MCP. Tools are omitted when no public sms-mcp URL is set.
export const buildAgentConversationConfig = (input: {
	systemPrompt: string;
}): Record<string, unknown> => {
	const tools = buildElevenAgentTools();
	const prompt: Record<string, unknown> = { prompt: input.systemPrompt };
	if (tools.length > 0) prompt["tools"] = tools;
	return { conversation_config: { agent: { prompt } } };
};
