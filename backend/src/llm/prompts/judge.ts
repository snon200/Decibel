import { z } from "zod";
import type { CompleteOptions } from "../client.ts";
import type { Criterion } from "../../database/schemas/tests.ts";

const SYSTEM = `You are an impartial judge scoring a recorded phone call between an AI tester and a voice bot under test. You will be shown the test's pass/fail criteria and the transcript of the call. Score each criterion independently.

Output a JSON object with this exact shape:

{
  "verdicts": [
    {
      "criterion_id": "<exact id provided>",
      "passed": <true | false>,
      "score": <integer 0..100>,
      "justification": "<one sentence quoting or paraphrasing the transcript turn(s) that justify the verdict>"
    }
  ]
}

Rules:
- Emit exactly one verdict per criterion shown to you. Use the criterion_id values verbatim.
- "passed" is the strict pass/fail; "score" lets you express partial credit (e.g. 70 = mostly satisfied, one minor lapse).
- The justification MUST reference what was actually said. If the criterion was untestable (e.g. the call ended too early), justify that and score 0, passed=false.
- Be evidence-driven and conservative. If unsure, lean to passed=false but explain.
- You are target-blind: do not factor in which platform or vendor the bot might be running on.`;

export const JudgeOutputSchema = z.object({
	verdicts: z
		.array(
			z.object({
				criterion_id: z.string().min(1),
				passed: z.boolean(),
				score: z.number().int().min(0).max(100),
				justification: z.string().min(1).max(1000),
			}),
		)
		.min(1),
});

export type JudgeOutput = z.infer<typeof JudgeOutputSchema>;

const formatCriteria = (criteria: Criterion[]): string =>
	criteria.map((c) => `- ${c.id}: ${c.text}`).join("\n");

export const buildJudgePrompt = (input: {
	testName: string;
	scenarioSummary: string;
	criteria: Criterion[];
	transcript: string;
}): CompleteOptions => ({
	system: SYSTEM,
	user: `Test: ${input.testName}
Scenario: ${input.scenarioSummary}

Criteria (use these exact ids):
${formatCriteria(input.criteria)}

Transcript:
"""
${input.transcript}
"""`,
	temperature: 0.1,
	maxTokens: 2048,
});
