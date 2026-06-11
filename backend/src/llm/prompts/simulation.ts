import type { CompleteOptions } from "../client.ts";

const SYSTEM = `You write production system prompts for AI voice agents. Given a free-text description of a phone bot, output a COMPLETE system prompt that makes an AI voice agent behave as faithfully as possible like that bot when it ANSWERS an inbound phone call.

Rules:
- Write the system prompt in the second person ("You are ...").
- Capture the bot's role, goals, the tasks it handles, and a natural phone tone.
- It answers INBOUND calls: open with a short greeting, then drive the conversation like the described bot would.
- Do not invent specifics the description does not provide (prices, names, hours). Handle unknowns gracefully.
- Include a voice-style rule: it is on a live phone call, so it must speak casually and naturally in one or two short sentences at a time, use contractions, and never read out lists or long explanations.
- Output ONLY the system prompt text — no preamble, no explanations, no markdown fences.`;

/**
 * Build the LLM request that turns a user's agent description into a system
 * prompt we can host on a competitor platform's number, so the competitor bot
 * mimics the user's Agent-Under-Test during comparison runs.
 */
export const buildSimulationPromptRequest = (input: {
	agentName: string;
	description: string;
}): CompleteOptions => ({
	system: SYSTEM,
	user: `Bot name: ${input.agentName}\n\nBot description:\n${input.description}`,
	temperature: 0.4,
	maxTokens: 1024,
});
