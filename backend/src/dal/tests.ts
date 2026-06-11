import { eq } from "drizzle-orm";
import { db } from "../database/data-source.ts";
import {
	tests,
	type Criterion,
	type NewTest,
	type Test,
} from "../database/schemas/tests.ts";

export type NewTestInput = {
	agentId: string;
	name: string;
	scenarioSummary: string;
	testerInstruction: string;
	criteria: Criterion[];
};

export const bulkCreateTests = async (input: {
	tests: NewTestInput[];
}): Promise<Test[]> => {
	if (input.tests.length === 0) return [];
	const rows = await db
		.insert(tests)
		.values(input.tests satisfies NewTest[])
		.returning();
	return rows;
};

export const replaceSuiteForAgent = async (input: {
	agentId: string;
	tests: NewTestInput[];
}): Promise<Test[]> => {
	return db.transaction(async (tx) => {
		await tx.delete(tests).where(eq(tests.agentId, input.agentId));
		if (input.tests.length === 0) return [];
		const rows = await tx
			.insert(tests)
			.values(input.tests satisfies NewTest[])
			.returning();
		return rows;
	});
};

export const getTest = async (input: { id: string }): Promise<Test | null> => {
	const [row] = await db.select().from(tests).where(eq(tests.id, input.id));
	return row ?? null;
};

export const listTestsForAgent = async (input: {
	agentId: string;
}): Promise<Test[]> => {
	return db
		.select()
		.from(tests)
		.where(eq(tests.agentId, input.agentId))
		.orderBy(tests.createdAt);
};

export const updateTest = async (input: {
	id: string;
	name?: string | undefined;
	scenarioSummary?: string | undefined;
	testerInstruction?: string | undefined;
	criteria?: Criterion[] | undefined;
}): Promise<Test> => {
	const patch: Partial<NewTest> = {};
	if (input.name !== undefined) patch.name = input.name;
	if (input.scenarioSummary !== undefined)
		patch.scenarioSummary = input.scenarioSummary;
	if (input.testerInstruction !== undefined)
		patch.testerInstruction = input.testerInstruction;
	if (input.criteria !== undefined) patch.criteria = input.criteria;
	const [row] = await db
		.update(tests)
		.set(patch)
		.where(eq(tests.id, input.id))
		.returning();
	if (!row) throw new Error("updateTest: no row for id " + input.id);
	return row;
};
