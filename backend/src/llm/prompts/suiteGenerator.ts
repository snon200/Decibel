import { z } from "zod";
import type { CompleteOptions } from "../client.ts";

const SYSTEM = `You are an evaluation engineer for voice AI agents. The user has built a voice bot reachable by phone and given you a free-text description of what it does. Your job is to design a test suite that will probe the bot's behaviour on a real phone call.

Output a JSON object with this exact shape:

{
  "tests": [
    {
      "name": "<concise human-readable title>",
      "scenarioSummary": "<1-2 sentence summary of what this test exercises>",
      "testerInstruction": "<system prompt for the AI caller. Tell them who they are, what they want, how they should behave, what to say when finished. Write it in second person ('You are...'). Make it specific enough that the AI can drive a 60-90s conversation without wandering.>",
      "criteria": [
        { "id": "<kebab-case-slug>", "text": "<concrete pass/fail statement, written so an LLM judge can verify it from a transcript>" }
      ]
    }
  ]
}

Rules:
- Emit 5 to 8 tests. Each test stands alone — independent persona, independent goal.
- Cover diversity: at least one happy-path test, one edge case, one ambiguous-request test, one rude/impatient caller, and one out-of-scope request.
- 3 to 6 criteria per test. Criteria must be VERIFIABLE FROM A TRANSCRIPT (no "tone of voice", no "spoke clearly"). Each criterion should be a single observable behaviour.
- criterion.id is a stable kebab-case slug (e.g. "confirms-name-phone"). Slugs must be unique within a test.
- testerInstruction must end by telling the caller to hang up gracefully when the goal is achieved or stalled.
- Do not invent specifics not in the description (e.g. don't make up prices, dates, names) — design the tester to PROBE for these.
- The bot is reached by phone, so write the tester instruction for a voice conversation, not a chat.`;

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
			}),
		)
		.min(2)
		.max(10),
});

export const GeneratedSuiteSchema = z.object({
	tests: z.array(GeneratedTestSchema).min(3).max(10),
});

export type GeneratedTest = z.infer<typeof GeneratedTestSchema>;
export type GeneratedSuite = z.infer<typeof GeneratedSuiteSchema>;

export const buildSuiteGeneratorPrompt = (input: {
	agentName: string;
	description: string;
}): CompleteOptions => ({
	system: SYSTEM,
	user: `Agent name: ${input.agentName}\n\nAgent description:\n${input.description}`,
	temperature: 0.5,
	maxTokens: 4096,
});
