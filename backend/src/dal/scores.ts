import { eq, inArray } from "drizzle-orm";
import { db } from "../database/data-source.ts";
import { scores, type NewScore, type Score } from "../database/schemas/scores.ts";

export type NewScoreInput = {
	criterionId: string;
	passed: boolean;
	score: number;
	justification: string;
};

export const upsertScores = async (input: {
	runId: string;
	scores: NewScoreInput[];
}): Promise<Score[]> => {
	if (input.scores.length === 0) return [];
	const values: NewScore[] = input.scores.map((s) => ({
		runId: input.runId,
		criterionId: s.criterionId,
		passed: s.passed,
		score: s.score,
		justification: s.justification,
	}));
	const rows = await db
		.insert(scores)
		.values(values)
		.onConflictDoUpdate({
			target: [scores.runId, scores.criterionId],
			set: {
				passed: scores.passed,
				score: scores.score,
				justification: scores.justification,
			},
		})
		.returning();
	return rows;
};

export const getScoresForRun = async (input: {
	runId: string;
}): Promise<Score[]> => {
	return db.select().from(scores).where(eq(scores.runId, input.runId));
};

export const getScoresForRuns = async (input: {
	runIds: string[];
}): Promise<Score[]> => {
	if (input.runIds.length === 0) return [];
	return db.select().from(scores).where(inArray(scores.runId, input.runIds));
};
