import * as RunsDal from "../../dal/runs.ts";
import * as TestsDal from "../../dal/tests.ts";
import * as ScoresDal from "../../dal/scores.ts";
import { BadRequestError, NotFoundError } from "../../lib/errors.ts";
import { logger } from "../../lib/logger.ts";
import { llm } from "../../llm/client.ts";
import { JudgeOutputSchema, buildJudgePrompt } from "../../llm/prompts/judge.ts";
import { overallScore } from "./overallScore.ts";

export const judgeRun = async (input: { runId: string }): Promise<void> => {
	const run = await RunsDal.getRun({ id: input.runId });
	if (!run) throw new NotFoundError("Run");
	if (!run.transcript || run.transcript.trim().length === 0) {
		throw new BadRequestError(
			"cannot judge run " + input.runId + ": transcript is empty",
		);
	}
	const test = await TestsDal.getTest({ id: run.testId });
	if (!test) throw new NotFoundError("Test");

	const prompt = buildJudgePrompt({
		testName: test.name,
		scenarioSummary: test.scenarioSummary,
		criteria: test.criteria,
		transcript: run.transcript,
	});
	const output = await llm.completeJson({
		...prompt,
		schema: JudgeOutputSchema,
	});

	const validCriterionIds = new Set(test.criteria.map((c) => c.id));
	const accepted = output.verdicts.filter((v) => {
		if (!validCriterionIds.has(v.criterion_id)) {
			logger.warn("judge: dropping unknown criterion id", {
				runId: run.id,
				criterionId: v.criterion_id,
			});
			return false;
		}
		return true;
	});

	if (accepted.length === 0) {
		throw new Error("judge produced no valid verdicts");
	}

	await ScoresDal.upsertScores({
		runId: run.id,
		scores: accepted.map((v) => ({
			criterionId: v.criterion_id,
			passed: v.passed,
			score: v.score,
			justification: v.justification,
		})),
	});

	const overall = overallScore(accepted.map((v) => ({ score: v.score })));
	await RunsDal.setOverallScore({ id: run.id, overallScore: overall });

	logger.info("judge applied", {
		runId: run.id,
		verdictCount: accepted.length,
		overallScore: overall,
	});
};
