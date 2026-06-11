import { z } from "zod";
import { complete } from "../../llm/client.ts";
import { buildJudgePrompt } from "../../llm/prompts/judgePrompt.ts";
import { LlmParseError } from "../../lib/errors.ts";
import * as ScoresDal from "../../dal/scores.ts";
import * as RunsDal from "../../dal/runs.ts";
import type { NewScoreInput } from "../../dal/scores.ts";
import type { Test } from "../../database/schemas/tests.ts";

const judgeSchema = z.object({
	scores: z.array(
		z.object({
			criterionId: z.string(),
			passed: z.boolean(),
			score: z.number(),
			justification: z.string(),
		}),
	),
});

const clampScore = (value: number): number =>
	Math.max(0, Math.min(100, Math.round(value)));

export const overallFromScores = (scores: NewScoreInput[]): number => {
	if (scores.length === 0) return 0;
	const sum = scores.reduce((acc, s) => acc + s.score, 0);
	return Math.round(sum / scores.length);
};

/**
 * Score a finished transcript against the test's criteria and persist the
 * verdicts + a run-level overall score. Target-blind by construction — it only
 * sees the transcript and criteria.
 */
export const judgeRun = async (input: {
	runId: string;
	test: Test;
	transcript: string;
}): Promise<void> => {
	const { system, user } = buildJudgePrompt({
		criteria: input.test.criteria,
		transcript: input.transcript,
	});
	const raw = await complete({ system, user, json: true, temperature: 0 });

	const parsed = judgeSchema.safeParse(raw);
	if (!parsed.success) throw new LlmParseError(parsed.error.message);

	const byId = new Map(parsed.data.scores.map((s) => [s.criterionId, s]));

	// Map back onto our criteria so every one gets exactly one row, even if the
	// judge omitted or hallucinated ids.
	const scoreInputs: NewScoreInput[] = input.test.criteria.map((c) => {
		const verdict = byId.get(c.id);
		if (!verdict) {
			return {
				criterionId: c.id,
				passed: false,
				score: 0,
				justification: "No verdict returned by judge.",
			};
		}
		return {
			criterionId: c.id,
			passed: verdict.passed,
			score: clampScore(verdict.score),
			justification: verdict.justification,
		};
	});

	await ScoresDal.upsertScores({ runId: input.runId, scores: scoreInputs });
	await RunsDal.setOverallScore({
		id: input.runId,
		overallScore: overallFromScores(scoreInputs),
	});
};
