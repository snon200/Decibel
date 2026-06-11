// A fully-specified VAPI assistant config. Shared by outbound calls (transient,
// inline on the call) and inbound numbers (saved, attached to a phone number) so
// the same system prompt runs identically in both directions.
export const buildVapiAssistant = (input: {
	systemPrompt: string;
	webhookUrl?: string;
}): Record<string, unknown> => {
	const assistant: Record<string, unknown> = {
		firstMessageMode: "assistant-speaks-first",
		model: {
			provider: "openai",
			model: "gpt-4o",
			messages: [{ role: "system", content: input.systemPrompt }],
		},
		voice: { provider: "vapi", voiceId: "Elliot" },
		transcriber: { provider: "deepgram", model: "nova-2" },
		artifactPlan: { recordingEnabled: true },
		serverMessages: ["end-of-call-report", "status-update"],
	};
	if (input.webhookUrl) {
		assistant["server"] = { url: input.webhookUrl };
	}
	return assistant;
};
