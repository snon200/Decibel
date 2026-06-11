// A fully-specified VAPI assistant config. Shared by outbound calls (transient,
// inline on the call) and inbound numbers (saved, attached to a phone number) so
// the same system prompt runs identically in both directions. Call results are
// read back by polling getCall — we don't register a server/webhook URL.
export const buildVapiAssistant = (input: {
	systemPrompt: string;
}): Record<string, unknown> => {
	return {
		firstMessageMode: "assistant-speaks-first",
		model: {
			provider: "openai",
			model: "gpt-4o",
			messages: [{ role: "system", content: input.systemPrompt }],
		},
		voice: { provider: "vapi", voiceId: "Elliot" },
		transcriber: { provider: "deepgram", model: "nova-2" },
		artifactPlan: { recordingEnabled: true },
	};
};
