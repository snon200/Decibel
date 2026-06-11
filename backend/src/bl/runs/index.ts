import * as RunsDal from "../../dal/runs.ts";
import * as TestsDal from "../../dal/tests.ts";
import * as ScoresDal from "../../dal/scores.ts";
import { NotFoundError } from "../../lib/errors.ts";
import type { Run } from "../../database/schemas/runs.ts";
import type { Test } from "../../database/schemas/tests.ts";
import type { Score } from "../../database/schemas/scores.ts";

export { startRun, resolveTarget } from "./startRun.ts";
export type { RunTarget } from "./startRun.ts";
export { runSuite } from "./runSuite.ts";
export { ingestCallResult } from "./ingestCallResult.ts";
export { judgeAndPersist } from "./judgeAndPersist.ts";

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
