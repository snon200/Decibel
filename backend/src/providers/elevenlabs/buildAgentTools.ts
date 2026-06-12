import { config } from "../../config/env.ts";

/**
 * Inline webhook tools that let an ElevenLabs agent-under-test text the caller
 * and send a Stripe payment link mid-call — the EL analogue of the Dial Context
 * MCP. They POST to the sms-mcp public tunnel; the caller's number rides along
 * as the `X-Caller-Id` header via the `{{system__caller_id}}` telephony variable
 * (auto-populated on phone calls), so the agent never has to ask for it.
 *
 * Returns [] when no public URL is configured, leaving the agent tool-less.
 */
export const buildElevenAgentTools = (): Record<string, unknown>[] => {
	const base = config.SMS_MCP_PUBLIC_URL;
	if (!base) return [];
	const root = base.replace(/\/+$/, "");

	// The caller's number and conversation id ride in the BODY, bound to
	// ElevenLabs telephony system variables. (System vars are NOT substituted in
	// request headers — only in parameters/prompts — so binding them as body
	// properties via `dynamic_variable` is the reliable path.)
	const to = {
		type: "string",
		dynamic_variable: "system__caller_id",
	};
	const conversationId = {
		type: "string",
		dynamic_variable: "system__conversation_id",
	};

	return [
		{
			type: "webhook",
			name: "send_sms",
			description:
				"Text the person on the current call. Use it to send a confirmation, summary, link, or code during or right after the conversation. The caller's number is attached automatically — just provide the message.",
			api_schema: {
				url: `${root}/tools/sms`,
				method: "POST",
				request_body_schema: {
					type: "object",
					properties: {
						message: {
							type: "string",
							description: "The SMS text to send to the caller.",
						},
						to,
						conversation_id: conversationId,
					},
					required: ["message"],
				},
			},
		},
		{
			type: "webhook",
			name: "send_payment_request",
			description:
				"Create a secure Stripe payment link and text it to the caller so they can pay on a hosted page. Use this when the caller agrees to pay or place a deposit. NEVER ask for or read card numbers over the phone — always send the link.",
			api_schema: {
				url: `${root}/tools/payment`,
				method: "POST",
				request_body_schema: {
					type: "object",
					properties: {
						description: {
							type: "string",
							description:
								"What the payment is for, shown on checkout, e.g. 'Auto insurance deposit'.",
						},
						amount_usd: {
							type: "number",
							description: "Amount in US dollars. Defaults to 1.00 if omitted.",
						},
						to,
						conversation_id: conversationId,
					},
					required: ["description"],
				},
			},
		},
	];
};
