import { z } from "zod";
import type { CompleteOptions } from "../client.ts";
import type { Criterion } from "../../database/schemas/tests.ts";
import type { CorrelatedMessage } from "../../database/schemas/runs.ts";

const SYSTEM = `You are an impartial judge scoring a recorded phone call between an AI tester and a voice bot under test. You will be shown the test's pass/fail criteria, the transcript of the call, and any SMS activity correlated to the call. Score each criterion independently.

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
- For criteria about the agent sending an SMS/text/confirmation, treat the "SMS activity" section as authoritative: a matching message there means it was sent (note the timing relative to the call); an empty section means no SMS was sent.
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

const formatSms = (messages: CorrelatedMessage[]): string => {
	if (messages.length === 0) {
		return "No SMS was sent by the agent during the call or before the transcript was finalized.";
	}
	return messages
		.map((m) => {
			const when =
				m.secondsFromCallEnd === null
					? "timing unknown"
					: m.secondsFromCallEnd <= 0
						? `${Math.abs(m.secondsFromCallEnd)}s before the call ended (during the call)`
						: `${m.secondsFromCallEnd}s after the call ended`;
			return `- [${when}] from ${m.from}: "${m.body}"`;
		})
		.join("\n");
};

const formatTiming = (input: {
	startedAt?: Date | null | undefined;
	endedAt?: Date | null | undefined;
	durationSeconds?: number | null | undefined;
}): string => {
	const parts: string[] = [];
	if (input.startedAt) parts.push(`started ${input.startedAt.toISOString()}`);
	if (input.endedAt) parts.push(`ended ${input.endedAt.toISOString()}`);
	if (input.durationSeconds != null)
		parts.push(`duration ${input.durationSeconds}s`);
	return parts.length > 0 ? parts.join(", ") : "unknown";
};

export const buildJudgePrompt = (input: {
	testName: string;
	scenarioSummary: string;
	criteria: Criterion[];
	transcript: string;
	messages?: CorrelatedMessage[];
	callStartedAt?: Date | null;
	callEndedAt?: Date | null;
	durationSeconds?: number | null;
}): CompleteOptions => ({
	system: SYSTEM,
	user: `Test: ${input.testName}
Scenario: ${input.scenarioSummary}

Call timing: ${formatTiming({
		startedAt: input.callStartedAt,
		endedAt: input.callEndedAt,
		durationSeconds: input.durationSeconds,
	})}

Criteria (use these exact ids):
${formatCriteria(input.criteria)}

Transcript:
"""
${input.transcript}
"""

SMS activity (inbound texts from the agent under test, correlated by number + time):
${formatSms(input.messages ?? [])}`,
	temperature: 0.1,
	maxTokens: 2048,
});
