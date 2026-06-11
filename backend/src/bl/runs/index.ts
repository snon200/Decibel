import * as RunsDal from "../../dal/runs.ts";
import * as TestsDal from "../../dal/tests.ts";
import * as ScoresDal from "../../dal/scores.ts";
import { NotFoundError } from "../../lib/errors.ts";
import type { Run } from "../../database/schemas/runs.ts";
import type { Test } from "../../database/schemas/tests.ts";
import type { Score } from "../../database/schemas/scores.ts";

export { startRun, runSuite } from "./startRun.ts";
export { ingestCallResult } from "./ingestCallResult.ts";
export { resolveTarget, type RunTarget } from "./target.ts";

export type RunDetail = {
	run: Run;
	test: Test;
	scores: Score[];
	audioUrl: string | null;
};

export const getRunResult = async (input: {
	id: string;
}): Promise<RunDetail> => {
	const run = await RunsDal.getRun({ id: input.id });
	if (!run) throw new NotFoundError("Run");
	const test = await TestsDal.getTest({ id: run.testId });
	if (!test) throw new NotFoundError("Test");
	const scores = await ScoresDal.getScoresForRun({ runId: run.id });
	return { run, test, scores, audioUrl: run.audioUrl };
};
