import { and, eq, inArray, isNotNull, lt, notInArray, sql } from "drizzle-orm";
import { db } from "../database/data-source.ts";
import { runs, type NewRun, type Run, type TargetKind } from "../database/schemas/runs.ts";
import { tests } from "../database/schemas/tests.ts";
import type { CallStatus } from "../providers/types.ts";
import { TERMINAL_STATUSES } from "../providers/types.ts";

export const createRun = async (input: {
	testId: string;
	targetKind: TargetKind;
	targetLabel: string;
	targetPhoneNumber: string;
	provider?: string;
	status?: CallStatus;
}): Promise<Run> => {
	const [row] = await db
		.insert(runs)
		.values({
			testId: input.testId,
			targetKind: input.targetKind,
			targetLabel: input.targetLabel,
			targetPhoneNumber: input.targetPhoneNumber,
			provider: input.provider ?? "dial",
			status: input.status ?? "queued",
		} satisfies NewRun)
		.returning();
	if (!row) throw new Error("createRun returned no row");
	return row;
};

export const getRun = async (input: { id: string }): Promise<Run | null> => {
	const [row] = await db.select().from(runs).where(eq(runs.id, input.id));
	return row ?? null;
};

export const getRunByExternalCallId = async (input: {
	externalCallId: string;
}): Promise<Run | null> => {
	const [row] = await db
		.select()
		.from(runs)
		.where(eq(runs.externalCallId, input.externalCallId));
	return row ?? null;
};

export const setRunCallId = async (input: {
	id: string;
	externalCallId: string;
	status: CallStatus;
}): Promise<Run> => {
	const [row] = await db
		.update(runs)
		.set({ externalCallId: input.externalCallId, status: input.status })
		.where(eq(runs.id, input.id))
		.returning();
	if (!row) throw new Error("setRunCallId: no row for id " + input.id);
	return row;
};

export type RunUpdate = {
	status?: CallStatus;
	transcript?: string | null;
	audioUrl?: string | null;
	durationSeconds?: number | null;
	error?: string | null;
	completedAt?: Date | null;
};

export const applyRunUpdate = async (input: {
	id: string;
	update: RunUpdate;
}): Promise<Run> => {
	const [row] = await db
		.update(runs)
		.set(input.update)
		.where(eq(runs.id, input.id))
		.returning();
	if (!row) throw new Error("applyRunUpdate: no row for id " + input.id);
	return row;
};

export const setOverallScore = async (input: {
	id: string;
	overallScore: number;
}): Promise<Run> => {
	const [row] = await db
		.update(runs)
		.set({ overallScore: input.overallScore })
		.where(eq(runs.id, input.id))
		.returning();
	if (!row) throw new Error("setOverallScore: no row for id " + input.id);
	return row;
};

export const listStaleRuns = async (input: {
	olderThanSeconds: number;
}): Promise<Run[]> => {
	const terminal = Array.from(TERMINAL_STATUSES);
	return db
		.select()
		.from(runs)
		.where(
			and(
				notInArray(runs.status, terminal),
				isNotNull(runs.externalCallId),
				lt(runs.createdAt, sql`now() - make_interval(secs => ${input.olderThanSeconds})`),
			),
		);
};

export const listRunsForTest = async (input: {
	testId: string;
}): Promise<Run[]> => {
	return db
		.select()
		.from(runs)
		.where(eq(runs.testId, input.testId))
		.orderBy(runs.createdAt);
};

export const listRunsForAgent = async (input: {
	agentId: string;
}): Promise<Run[]> => {
	return db
		.select({
			id: runs.id,
			testId: runs.testId,
			targetKind: runs.targetKind,
			targetLabel: runs.targetLabel,
			targetPhoneNumber: runs.targetPhoneNumber,
			provider: runs.provider,
			externalCallId: runs.externalCallId,
			status: runs.status,
			transcript: runs.transcript,
			audioUrl: runs.audioUrl,
			durationSeconds: runs.durationSeconds,
			overallScore: runs.overallScore,
			error: runs.error,
			createdAt: runs.createdAt,
			completedAt: runs.completedAt,
		})
		.from(runs)
		.innerJoin(tests, eq(tests.id, runs.testId))
		.where(eq(tests.agentId, input.agentId))
		.orderBy(runs.createdAt);
};

export const listRunsByIds = async (input: {
	ids: string[];
}): Promise<Run[]> => {
	if (input.ids.length === 0) return [];
	return db.select().from(runs).where(inArray(runs.id, input.ids));
};
