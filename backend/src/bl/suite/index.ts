import * as TestsDal from "../../dal/tests.ts";
import * as AgentsDal from "../../dal/agents.ts";
import { BadRequestError, NotFoundError } from "../../lib/errors.ts";
import { logger } from "../../lib/logger.ts";
import { llm } from "../../llm/client.ts";
import {
	GeneratedSuiteSchema,
	buildSuiteGeneratorPrompt,
} from "../../llm/prompts/suiteGenerator.ts";
import type { NewTestInput } from "../../dal/tests.ts";
import type { Criterion, Test } from "../../database/schemas/tests.ts";

// Pure: ask the LLM to design a suite for the agent. Does not persist.
const callLlm = async (input: {
	agentId: string;
	name: string;
	description: string;
}): Promise<NewTestInput[]> => {
	const prompt = buildSuiteGeneratorPrompt({
		agentName: input.name,
		description: input.description,
	});
	const result = await llm.completeJson({
		...prompt,
		schema: GeneratedSuiteSchema,
	});

	return result.tests.map((t) => {
		const seen = new Set<string>();
		const criteria: Criterion[] = [];
		for (const c of t.criteria) {
			if (seen.has(c.id)) continue;
			seen.add(c.id);
			criteria.push({ id: c.id, text: c.text });
		}
		return {
			agentId: input.agentId,
			name: t.name,
			scenarioSummary: t.scenarioSummary,
			testerInstruction: t.testerInstruction,
			criteria,
		};
	});
};

export const generateFromDescription = async (input: {
	agentId: string;
	name: string;
	description: string;
}): Promise<Test[]> => {
	const tests = await callLlm(input);
	const inserted = await TestsDal.bulkCreateTests({ tests });
	logger.info("suite generated", {
		agentId: input.agentId,
		count: inserted.length,
	});
	return inserted;
};

export const regenerateSuite = async (input: {
	agentId: string;
}): Promise<Test[]> => {
	const agent = await AgentsDal.getAgent({ id: input.agentId });
	if (!agent) throw new NotFoundError("Agent");
	const tests = await callLlm({
		agentId: agent.id,
		name: agent.name,
		description: agent.description,
	});
	const inserted = await TestsDal.replaceSuiteForAgent({
		agentId: agent.id,
		tests,
	});
	logger.info("suite regenerated", {
		agentId: agent.id,
		count: inserted.length,
	});
	return inserted;
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
