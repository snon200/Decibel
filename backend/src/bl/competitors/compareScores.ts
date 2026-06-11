import * as AgentsDal from "../../dal/agents.ts";
import * as TestsDal from "../../dal/tests.ts";
import * as RunsDal from "../../dal/runs.ts";
import * as ScoresDal from "../../dal/scores.ts";
import { NotFoundError } from "../../lib/errors.ts";
import type { Run } from "../../database/schemas/runs.ts";
import type { Score } from "../../database/schemas/scores.ts";

const USER_BOT_KEY = "user_bot";

export type SideResult = {
	runId: string;
	status: string;
	overallScore: number | null;
	scores: Score[];
} | null;

export type ComparisonRow = {
	testId: string;
	testName: string;
	userBot: SideResult;
	/** Keyed by competitor label (platform name). */
	competitors: Record<string, SideResult>;
};

export type SideAggregate = {
	runsScored: number;
	avgOverallScore: number | null;
	/** Fraction of judged criteria that passed, 0..1, across the latest runs. */
	criteriaPassRate: number | null;
};

export type Comparison = {
	agentId: string;
	competitorLabels: string[];
	rows: ComparisonRow[];
	aggregates: {
		userBot: SideAggregate;
		competitors: Record<string, SideAggregate>;
	};
};

const sideKeyFor = (run: Run): string =>
	run.targetKind === "user_bot" ? USER_BOT_KEY : `competitor:${run.targetLabel}`;

/**
 * Assemble a side-by-side scorecard for an agent: the latest user-bot run vs the
 * latest competitor run per test, plus per-side aggregates.
 */
export const compareScores = async (input: {
	agentId: string;
}): Promise<Comparison> => {
	const agent = await AgentsDal.getAgent({ id: input.agentId });
	if (!agent) throw new NotFoundError("Agent");

	const tests = await TestsDal.listTestsForAgent({ agentId: agent.id });
	const allRuns = await RunsDal.listRunsForAgent({ agentId: agent.id });

	// Runs come back ascending by createdAt, so the last write wins = latest run.
	const latestByTestSide = new Map<string, Run>();
	const competitorLabels = new Set<string>();
	for (const run of allRuns) {
		if (run.targetKind === "competitor") competitorLabels.add(run.targetLabel);
		latestByTestSide.set(`${run.testId}::${sideKeyFor(run)}`, run);
	}

	const selectedRuns = Array.from(latestByTestSide.values());
	const scoreRows = await ScoresDal.getScoresForRuns({
		runIds: selectedRuns.map((r) => r.id),
	});
	const scoresByRun = new Map<string, Score[]>();
	for (const score of scoreRows) {
		const list = scoresByRun.get(score.runId) ?? [];
		list.push(score);
		scoresByRun.set(score.runId, list);
	}

	const toSide = (run: Run | undefined): SideResult => {
		if (!run) return null;
		return {
			runId: run.id,
			status: run.status,
			overallScore: run.overallScore,
			scores: scoresByRun.get(run.id) ?? [],
		};
	};

	const labels = Array.from(competitorLabels).sort();
	const rows: ComparisonRow[] = tests.map((test) => {
		const competitorsForRow: Record<string, SideResult> = {};
		for (const label of labels) {
			competitorsForRow[label] = toSide(
				latestByTestSide.get(`${test.id}::competitor:${label}`),
			);
		}
		return {
			testId: test.id,
			testName: test.name,
			userBot: toSide(latestByTestSide.get(`${test.id}::${USER_BOT_KEY}`)),
			competitors: competitorsForRow,
		};
	});

	const aggregateFor = (
		pick: (row: ComparisonRow) => SideResult,
	): SideAggregate => {
		const sides = rows
			.map(pick)
			.filter((s): s is NonNullable<SideResult> => s !== null);
		const scored = sides.filter((s) => s.overallScore !== null);
		const avgOverallScore = scored.length
			? Math.round(
					scored.reduce((acc, s) => acc + (s.overallScore ?? 0), 0) /
						scored.length,
				)
			: null;
		let passed = 0;
		let total = 0;
		for (const side of sides) {
			for (const score of side.scores) {
				total += 1;
				if (score.passed) passed += 1;
			}
		}
		return {
			runsScored: scored.length,
			avgOverallScore,
			criteriaPassRate: total > 0 ? passed / total : null,
		};
	};

	return {
		agentId: agent.id,
		competitorLabels: labels,
		rows,
		aggregates: {
			userBot: aggregateFor((row) => row.userBot),
			competitors: Object.fromEntries(
				labels.map((label) => [
					label,
					aggregateFor((row) => row.competitors[label] ?? null),
				]),
			),
		},
	};
};
