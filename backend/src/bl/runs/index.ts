import * as RunsDal from "../../dal/runs.ts";
import * as TestsDal from "../../dal/tests.ts";
import * as ScoresDal from "../../dal/scores.ts";
import * as AgentsDal from "../../dal/agents.ts";
import * as CompetitorsDal from "../../dal/competitors.ts";
import { NotFoundError, NotImplementedError } from "../../lib/errors.ts";
import type { Run, TargetKind } from "../../database/schemas/runs.ts";
import type { Test } from "../../database/schemas/tests.ts";
import type { Score } from "../../database/schemas/scores.ts";

export type RunTarget =
	| { kind: "user_bot" }
	| { kind: "competitor"; competitorId: string };

export type RunDetail = {
	run: Run;
	test: Test;
	scores: Score[];
	audioUrl: string | null;
};

export const startRun = async (_input: {
	testId: string;
	target: RunTarget;
}): Promise<Run> => {
	throw new NotImplementedError(
		"runs.startRun (Run state machine wiring to providers/dial pending)",
	);
};

export const runSuite = async (_input: {
	agentId: string;
	target: RunTarget;
}): Promise<Run[]> => {
	throw new NotImplementedError("runs.runSuite (depends on startRun)");
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

// Resolve a RunTarget to a concrete dialing destination + label.
// Exposed for upcoming startRun implementation; kept here so the contract is
// in one place.
export const resolveTarget = async (input: {
	agentId: string;
	target: RunTarget;
}): Promise<{ kind: TargetKind; label: string; phoneNumber: string }> => {
	if (input.target.kind === "user_bot") {
		const agent = await AgentsDal.getAgent({ id: input.agentId });
		if (!agent) throw new NotFoundError("Agent");
		return {
			kind: "user_bot",
			label: "User bot",
			phoneNumber: agent.phoneNumber,
		};
	}
	const competitor = await CompetitorsDal.getCompetitor({
		id: input.target.competitorId,
	});
	if (!competitor) throw new NotFoundError("Competitor");
	return {
		kind: "competitor",
		label: competitor.platform,
		phoneNumber: competitor.phoneNumber,
	};
};
