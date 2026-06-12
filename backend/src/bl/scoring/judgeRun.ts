import * as RunsDal from "../../dal/runs.ts";
import * as TestsDal from "../../dal/tests.ts";
import * as ScoresDal from "../../dal/scores.ts";
import { BadRequestError, NotFoundError } from "../../lib/errors.ts";
import { logger } from "../../lib/logger.ts";
import { llm } from "../../llm/client.ts";
import { JudgeOutputSchema, buildJudgePrompt } from "../../llm/prompts/judge.ts";
import { overallScore } from "./overallScore.ts";
import type { Criterion, CriterionKind } from "../../database/schemas/tests.ts";

const kindOf = (c: Criterion): CriterionKind => c.kind ?? "transcript";

type Verdict = {
	criterionId: string;
	passed: boolean;
	score: number;
	justification: string;
};

/**
 * Deterministic verdicts for kinds that don't need an LLM.
 * Currently only `received_sms` — pass iff at least one inbound SMS was
 * correlated to this call.
 */
const judgeReceivedSms = (
	criterion: Criterion,
	inboundSmsCount: number,
): Verdict => {
	const passed = inboundSmsCount > 0;
	return {
		criterionId: criterion.id,
		passed,
		score: passed ? 100 : 0,
		justification: passed
			? `Received ${inboundSmsCount} SMS from the bot during the call window.`
			: "No SMS was received from the bot during the call window.",
	};
};

/** Auto-fail with explanation when an sms_content criterion has no SMS to grade. */
const failSmsContent = (criterion: Criterion): Verdict => ({
	criterionId: criterion.id,
	passed: false,
	score: 0,
	justification:
		"No SMS was received from the bot; cannot evaluate SMS content.",
});

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

	const messages = run.messages ?? [];
	const inboundSmsCount = messages.filter(
		(m) => m.direction === "inbound",
	).length;

	// Partition criteria. received_sms is fully deterministic; transcript and
	// sms_content go through the LLM (sms_content auto-fails if there are zero
	// SMS to grade, so we skip the LLM call for those too).
	const deterministic: Verdict[] = [];
	const forLlm: Criterion[] = [];
	for (const c of test.criteria) {
		const k = kindOf(c);
		if (k === "received_sms") {
			deterministic.push(judgeReceivedSms(c, inboundSmsCount));
		} else if (k === "sms_content" && inboundSmsCount === 0) {
			deterministic.push(failSmsContent(c));
		} else {
			forLlm.push(c);
		}
	}

	const verdicts: Verdict[] = [...deterministic];

	if (forLlm.length > 0) {
		const prompt = buildJudgePrompt({
			testName: test.name,
			scenarioSummary: test.scenarioSummary,
			criteria: forLlm,
			transcript: run.transcript,
			messages,
			callStartedAt: run.createdAt,
			callEndedAt: run.completedAt,
			durationSeconds: run.durationSeconds,
		});
		const output = await llm.completeJson({
			...prompt,
			schema: JudgeOutputSchema,
		});

		const validCriterionIds = new Set(forLlm.map((c) => c.id));
		for (const v of output.verdicts) {
			if (!validCriterionIds.has(v.criterion_id)) {
				logger.warn("judge: dropping unknown criterion id", {
					runId: run.id,
					criterionId: v.criterion_id,
				});
				continue;
			}
			verdicts.push({
				criterionId: v.criterion_id,
				passed: v.passed,
				score: v.score,
				justification: v.justification,
			});
		}
	}

	if (verdicts.length === 0) {
		throw new Error("judge produced no valid verdicts");
	}

	await ScoresDal.upsertScores({
		runId: run.id,
		scores: verdicts.map((v) => ({
			criterionId: v.criterionId,
			passed: v.passed,
			score: v.score,
			justification: v.justification,
		})),
	});

	const overall = overallScore(verdicts.map((v) => ({ score: v.score })));
	await RunsDal.setOverallScore({ id: run.id, overallScore: overall });

	logger.info("judge applied", {
		runId: run.id,
		verdictCount: verdicts.length,
		deterministic: deterministic.length,
		llmJudged: verdicts.length - deterministic.length,
		overallScore: overall,
	});
};
