import { z } from "zod";
import type { CompleteOptions } from "../client.ts";

const SYSTEM = `You are an evaluation engineer for voice AI agents. The user has built a voice bot reachable by phone and given you a free-text description of what it does. Your job is to (a) name the agent and (b) design a test suite that will probe its behaviour on a real phone call.

Output a JSON object with this exact shape:

{
  "agentName": "<2 to 5 words; a concise human-readable name for the bot itself (not a description)>",
  "tests": [
    {
      "name": "<concise human-readable title for THIS TEST>",
      "scenarioSummary": "<1-2 sentence summary of what this test exercises>",
      "testerInstruction": "<system prompt for the AI caller. Tell them who they are, what they want, how they should behave, what to say when finished. Write it in second person ('You are...'). Make it specific enough that the AI can drive a 60-90s conversation without wandering.>",
      "criteria": [
        { "id": "<kebab-case-slug>", "text": "<concrete pass/fail statement, written so an LLM judge can verify it from a transcript>", "kind": "transcript" }
      ]
    }
  ]
}

Rules for agentName:
- Title-case, 2 to 5 words, no quotes or punctuation. Examples: "Tony's Pizza Receptionist", "Verizon Refund Assistant", "Clinic Booking Bot".
- If the user supplied a name hint, use it verbatim unless it is obviously a description rather than a name.

Rules for tests:
- Emit 5 to 8 tests. Each test stands alone — independent persona, independent goal.
- Cover diversity: at least one happy-path test, one edge case, one ambiguous-request test, one rude/impatient caller, and one out-of-scope request.
- 3 to 6 criteria per test. Each criterion is a single observable behaviour.
- criterion.id is a stable kebab-case slug (e.g. "confirms-name-phone"). Slugs must be unique within a test.
- testerInstruction must end by telling the caller to hang up gracefully when the goal is achieved or stalled, AND to never exceed about 8 minutes of conversation — calls are hard-capped at 10 minutes and will be terminated.
- testerInstruction must tell the caller to speak like a real person on a phone call: casual, natural, spoken language, one or two short sentences at a time, no lists or long monologues.
- Do not invent specifics not in the description (e.g. don't make up prices, dates, names) — design the tester to PROBE for these.
- The bot is reached by phone, so write the tester instruction for a voice conversation, not a chat.

CRITERION KINDS — every criterion must include a "kind" field, one of:
- "transcript"   — verifiable from the call transcript alone (no SMS involved). Use this for most criteria: things the bot said or did on the call. Default kind for any criterion that talks about the call.
- "received_sms" — verifiable only by whether the tester actually received an SMS from the bot during/around the call. Use for criteria like "sends a confirmation SMS" or "texts the caller a receipt". Pass = at least one SMS arrived; the text field describes WHY we expected one.
- "sms_content" — verifiable from the body of the SMS the bot sent. Use for criteria like "SMS contains the booking time" or "SMS includes a tracking link". Auto-fails if no SMS arrived.

Only emit "received_sms" / "sms_content" criteria when the agent's description (or this specific test) implies the bot SENDS SMS — confirmations, receipts, OTPs, follow-ups, notifications, links, etc. If the bot is voice-only with no SMS mentioned, use only "transcript".`;

export const GeneratedTestSchema = z.object({
	name: z.string().min(1).max(200),
	scenarioSummary: z.string().min(1).max(2000),
	testerInstruction: z.string().min(20).max(8000),
	criteria: z
		.array(
			z.object({
				id: z
					.string()
					.min(1)
					.regex(/^[a-z0-9][a-z0-9-]*$/, "criterion.id must be kebab-case"),
				text: z.string().min(1).max(500),
				kind: z
					.enum(["transcript", "received_sms", "sms_content"])
					.optional(),
			}),
		)
		.min(2)
		.max(10),
});

export const GeneratedSuiteSchema = z.object({
	agentName: z.string().min(1).max(120),
	tests: z.array(GeneratedTestSchema).min(3).max(10),
});

export type GeneratedTest = z.infer<typeof GeneratedTestSchema>;
export type GeneratedSuite = z.infer<typeof GeneratedSuiteSchema>;

export const buildSuiteGeneratorPrompt = (input: {
	agentNameHint?: string;
	description: string;
}): CompleteOptions => ({
	system: SYSTEM,
	user: `Agent name hint (may be empty): ${input.agentNameHint ?? ""}

Agent description:
${input.description}`,
	temperature: 0.5,
	maxTokens: 4096,
});
