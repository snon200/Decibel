import * as TestsDal from "../../dal/tests.ts";
import * as AgentsDal from "../../dal/agents.ts";
import {
	BadRequestError,
	NotFoundError,
	NotImplementedError,
} from "../../lib/errors.ts";
import type { Criterion, Test } from "../../database/schemas/tests.ts";

export const generateFromDescription = async (_input: {
	agentId: string;
	name: string;
	description: string;
}): Promise<Test[]> => {
	throw new NotImplementedError("suite.generateFromDescription (LLM call pending)");
};

export const regenerateSuite = async (input: {
	agentId: string;
}): Promise<Test[]> => {
	const agent = await AgentsDal.getAgent({ id: input.agentId });
	if (!agent) throw new NotFoundError("Agent");
	return generateFromDescription({
		agentId: agent.id,
		name: agent.name,
		description: agent.description,
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
