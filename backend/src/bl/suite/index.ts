import * as TestsDal from "../../dal/tests.ts";
import * as AgentsDal from "../../dal/agents.ts";
import { BadRequestError, NotFoundError } from "../../lib/errors.ts";
import { draftToTests, generateSuiteDraft } from "./generateSuite.ts";
import type { Criterion, Test } from "../../database/schemas/tests.ts";

// Generate a suite from the agent description and persist it (additive).
export const generateFromDescription = async (input: {
	agentId: string;
	name: string;
	description: string;
}): Promise<Test[]> => {
	const draft = await generateSuiteDraft({
		name: input.name,
		description: input.description,
	});
	return TestsDal.bulkCreateTests({
		tests: draftToTests({ agentId: input.agentId, draft }),
	});
};

// Replace the agent's existing suite with a freshly generated one.
export const regenerateSuite = async (input: {
	agentId: string;
}): Promise<Test[]> => {
	const agent = await AgentsDal.getAgent({ id: input.agentId });
	if (!agent) throw new NotFoundError("Agent");
	const draft = await generateSuiteDraft({
		name: agent.name,
		description: agent.description,
	});
	return TestsDal.replaceSuiteForAgent({
		agentId: agent.id,
		tests: draftToTests({ agentId: agent.id, draft }),
	});
};

export const listTestsForAgent = async (input: {
	agentId: string;
}): Promise<Test[]> => {
	const agent = await AgentsDal.getAgent({ id: input.agentId });
	if (!agent) throw new NotFoundError("Agent");
	return TestsDal.listTestsForAgent({ agentId: agent.id });
};

export const getTest = async (input: { id: string }): Promise<Test> => {
	const test = await TestsDal.getTest({ id: input.id });
	if (!test) throw new NotFoundError("Test");
	return test;
};

export const updateTest = async (input: {
	id: string;
	name?: string | undefined;
	scenarioSummary?: string | undefined;
	testerInstruction?: string | undefined;
	criteria?: Criterion[] | undefined;
}): Promise<Test> => {
	const existing = await TestsDal.getTest({ id: input.id });
	if (!existing) throw new NotFoundError("Test");
	if (input.criteria !== undefined) validateCriteria(input.criteria);
	return TestsDal.updateTest(input);
};

export const validateCriteria = (criteria: Criterion[]): void => {
	if (criteria.length === 0) {
		throw new BadRequestError("criteria must not be empty");
	}
	const seen = new Set<string>();
	for (const c of criteria) {
		if (!c.id || c.id.trim() === "") {
			throw new BadRequestError("criterion.id must be non-empty");
		}
		if (!c.text || c.text.trim() === "") {
			throw new BadRequestError("criterion.text must be non-empty");
		}
		if (seen.has(c.id)) {
			throw new BadRequestError(`duplicate criterion id: ${c.id}`);
		}
		seen.add(c.id);
	}
};
