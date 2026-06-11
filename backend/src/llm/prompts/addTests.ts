import { z } from "zod";
import type { CompleteOptions } from "../client.ts";
import { GeneratedTestSchema } from "./suiteGenerator.ts";

const SYSTEM = `You are extending an existing test suite for a voice AI agent. The user has already designed a suite of tests; your job is to design ADDITIONAL tests that complement what's there.

Output a JSON object with this exact shape:

{
  "tests": [
    {
      "name": "<concise human-readable title for THIS TEST>",
      "scenarioSummary": "<1-2 sentence summary of what this test exercises>",
      "testerInstruction": "<system prompt for the AI caller. Tell them who they are, what they want, how they should behave, what to say when finished. Write it in second person ('You are...'). Make it specific enough that the AI can drive a 60-90s conversation without wandering.>",
      "criteria": [
        { "id": "<kebab-case-slug>", "text": "<concrete pass/fail statement, written so an LLM judge can verify it from a transcript>" }
      ]
    }
  ]
}

Rules:
- Emit exactly the requested number of tests.
- Each new test must explore a scenario NOT already covered by the existing tests listed below — read their names + summaries carefully and avoid overlap.
- If the user provided a "focus" hint, design every new test to probe that focus area.
- If no focus is provided, fill gaps in the existing coverage: rare edge cases, hostile or impatient callers, ambiguous requests, multi-step flows, recovery from interruption, out-of-scope asks.
- 3 to 6 criteria per test. Criteria must be VERIFIABLE FROM A TRANSCRIPT (no "tone of voice", no "spoke clearly"). Each criterion should be a single observable behaviour.
- criterion.id is a stable kebab-case slug (e.g. "confirms-name-phone"). Slugs must be unique within a test.
- testerInstruction must end by telling the caller to hang up gracefully when the goal is achieved or stalled, AND to never exceed about 8 minutes of conversation — calls are hard-capped at 10 minutes and will be terminated.
- Do not invent specifics not in the description — design the tester to PROBE for them.
- The bot is reached by phone, so write the tester instruction for a voice conversation, not a chat.`;

export const AddedTestsSchema = z.object({
	tests: z.array(GeneratedTestSchema).min(1).max(10),
});

export type AddedTests = z.infer<typeof AddedTestsSchema>;

const formatExisting = (
	existing: { name: string; scenarioSummary: string }[],
): string =>
	existing.length === 0
		? "(none — this will be the first batch)"
		: existing
				.map((t, i) => `${i + 1}. ${t.name} — ${t.scenarioSummary}`)
				.join("\n");

export const buildAddTestsPrompt = (input: {
	agentName: string;
	description: string;
	existing: { name: string; scenarioSummary: string }[];
	focus?: string;
	count: number;
}): CompleteOptions => ({
	system: SYSTEM,
	user: `Agent name: ${input.agentName}

Agent description:
${input.description}

Existing tests (avoid duplicating these scenarios):
${formatExisting(input.existing)}

Focus for the new tests (may be empty):
${input.focus?.trim() || "(no specific focus — fill coverage gaps)"}

Number of new tests to generate: ${input.count}`,
	temperature: 0.6,
	maxTokens: 4096,
});
