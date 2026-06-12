import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { resolveFromNumberId, sendSms } from "./dialClient.ts";
import { createCheckoutSession } from "./stripeClient.ts";

/** Live call context Dial injects as headers on every per-call MCP request. */
export interface CallContext {
	direction: string | undefined;
	userNumber: string | undefined;
	agentNumber: string | undefined;
}

/**
 * A fresh MCP server bound to one call's context. The send_sms tool texts the
 * caller (X-Dial-User-Number) by default, from the number the call is on.
 */
export const buildMcpServer = (ctx: CallContext): McpServer => {
	const server = new McpServer({ name: "dial-sms-mcp", version: "1.0.0" });

	server.registerTool(
		"send_sms",
		{
			title: "Send SMS",
			description:
				"Send an SMS text message to the person on the current call. Use it to send a confirmation, summary, link, or code during or right after the conversation. By default it texts the caller; pass `to` only to override.",
			inputSchema: {
				body: z.string().min(1).describe("The SMS message text to send."),
				to: z
					.string()
					.optional()
					.describe(
						"E.164 recipient. Defaults to the caller on the current call — usually leave empty.",
					),
			},
		},
		async ({ body, to }) => {
			const recipient = to ?? ctx.userNumber;
			if (!recipient || recipient.startsWith("{{")) {
				return {
					isError: true,
					content: [
						{
							type: "text",
							text: "No recipient available — there is no active caller and no `to` was provided.",
						},
					],
				};
			}
			try {
				const fromNumberId = await resolveFromNumberId(ctx.agentNumber);
				await sendSms({ to: recipient, fromNumberId, body });
				return {
					content: [{ type: "text", text: `SMS sent to ${recipient}.` }],
				};
			} catch (err) {
				return {
					isError: true,
					content: [
						{
							type: "text",
							text: `Failed to send SMS: ${err instanceof Error ? err.message : String(err)}`,
						},
					],
				};
			}
		},
	);

	server.registerTool(
		"send_payment_request",
		{
			title: "Send Payment Request",
			description:
				"Create a secure Stripe payment link for an amount and text it to the caller so they can pay on a hosted page. Use this when the caller agrees to pay. NEVER ask for or read card numbers over the phone — always send the link. The amount is in US dollars; Stripe does not allow $0, so the minimum is about $0.50.",
			inputSchema: {
				description: z
					.string()
					.min(1)
					.describe(
						"What the payment is for, shown on the checkout page, e.g. 'Auto insurance deposit'.",
					),
				amountUsd: z
					.number()
					.positive()
					.optional()
					.describe("Amount in US dollars. Defaults to 1.00 if omitted."),
				to: z
					.string()
					.optional()
					.describe(
						"E.164 recipient. Defaults to the caller on the current call — usually leave empty.",
					),
			},
		},
		async ({ description, amountUsd, to }) => {
			const recipient = to ?? ctx.userNumber;
			if (!recipient || recipient.startsWith("{{")) {
				return {
					isError: true,
					content: [
						{
							type: "text",
							text: "No recipient available — there is no active caller and no `to` was provided.",
						},
					],
				};
			}
			try {
				const amountCents = Math.max(50, Math.round((amountUsd ?? 1) * 100));
				const session = await createCheckoutSession({
					amountCents,
					description,
				});
				const fromNumberId = await resolveFromNumberId(ctx.agentNumber);
				await sendSms({
					to: recipient,
					fromNumberId,
					body: `Here's your secure payment link for ${description} ($${(amountCents / 100).toFixed(2)}): ${session.url}`,
				});
				return {
					content: [
						{
							type: "text",
							text: `Payment link created and texted to ${recipient}: ${session.url}`,
						},
					],
				};
			} catch (err) {
				return {
					isError: true,
					content: [
						{
							type: "text",
							text: `Failed to send payment request: ${err instanceof Error ? err.message : String(err)}`,
						},
					],
				};
			}
		},
	);

	return server;
};
