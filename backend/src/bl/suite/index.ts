import * as TestsDal from "../../dal/tests.ts";
import * as AgentsDal from "../../dal/agents.ts";
import * as RunsDal from "../../dal/runs.ts";
import { BadRequestError, NotFoundError } from "../../lib/errors.ts";
import { logger } from "../../lib/logger.ts";
import { llm } from "../../llm/client.ts";
import {
	GeneratedSuiteSchema,
	buildSuiteGeneratorPrompt,
} from "../../llm/prompts/suiteGenerator.ts";
import {
	AddedTestsSchema,
	buildAddTestsPrompt,
} from "../../llm/prompts/addTests.ts";
import type { NewTestInput } from "../../dal/tests.ts";
import type { Criterion, Test } from "../../database/schemas/tests.ts";

const dedupeCriteria = (raw: Criterion[]): Criterion[] => {
	const seen = new Set<string>();
	const out: Criterion[] = [];
	for (const c of raw) {
		if (seen.has(c.id)) continue;
		seen.add(c.id);
		out.push({
			id: c.id,
			text: c.text,
			...(c.kind ? { kind: c.kind } : {}),
		});
	}
	return out;
};

const DEFAULT_ADD_COUNT = 3;
const MIN_ADD_COUNT = 1;
const MAX_ADD_COUNT = 8;

export type GeneratedContent = {
	agentName: string;
	// tests without agentId — caller fills it in once the agent row exists.
	tests: Omit<NewTestInput, "agentId">[];
};

// Pure LLM call. Returns the generated content; does not persist.
// Surfaces to bl/agents.createAgent (which uses the name) and to internal
// suite functions below (which then attach an agentId and persist).
export const generateContent = async (input: {
	agentNameHint?: string;
	description: string;
}): Promise<GeneratedContent> => {
	const prompt = buildSuiteGeneratorPrompt({
		...(input.agentNameHint ? { agentNameHint: input.agentNameHint } : {}),
		description: input.description,
	});
	const result = await llm.completeJson({
		...prompt,
		schema: GeneratedSuiteSchema,
	});

	const tests = result.tests.map((t) => {
		const seen = new Set<string>();
		const criteria: Criterion[] = [];
		for (const c of t.criteria) {
			if (seen.has(c.id)) continue;
			seen.add(c.id);
			criteria.push({
				id: c.id,
				text: c.text,
				...(c.kind ? { kind: c.kind } : {}),
			});
		}
		return {
			name: t.name,
			scenarioSummary: t.scenarioSummary,
			testerInstruction: t.testerInstruction,
			criteria,
		};
	});

	return { agentName: result.agentName.trim(), tests };
};

export const generateFromDescription = async (input: {
	agentId: string;
	description: string;
}): Promise<Test[]> => {
	const content = await generateContent({ description: input.description });
	const inserted = await TestsDal.bulkCreateTests({
		tests: content.tests.map((t) => ({ ...t, agentId: input.agentId })),
	});
	logger.info("suite generated", {
		agentId: input.agentId,
		count: inserted.length,
	});
	return inserted;
};

export const addTests = async (input: {
	agentId: string;
	focus?: string | undefined;
	count?: number | undefined;
}): Promise<Test[]> => {
	const agent = await AgentsDal.getAgent({ id: input.agentId });
	if (!agent) throw new NotFoundError("Agent");

	const requested = input.count ?? DEFAULT_ADD_COUNT;
	if (!Number.isInteger(requested) || requested < MIN_ADD_COUNT || requested > MAX_ADD_COUNT) {
		throw new BadRequestError(
			`count must be an integer between ${MIN_ADD_COUNT} and ${MAX_ADD_COUNT}`,
		);
	}

	const existing = await TestsDal.listTestsForAgent({ agentId: agent.id });
	const prompt = buildAddTestsPrompt({
		agentName: agent.name,
		description: agent.description,
		existing: existing.map((t) => ({
			name: t.name,
			scenarioSummary: t.scenarioSummary,
		})),
		...(input.focus?.trim() ? { focus: input.focus.trim() } : {}),
		count: requested,
	});

	const result = await llm.completeJson({
		...prompt,
		schema: AddedTestsSchema,
	});

	const inserted = await TestsDal.bulkCreateTests({
		tests: result.tests.map((t) => ({
			agentId: agent.id,
			name: t.name,
			scenarioSummary: t.scenarioSummary,
			testerInstruction: t.testerInstruction,
			criteria: dedupeCriteria(t.criteria),
		})),
	});
	logger.info("tests appended to suite", {
		agentId: agent.id,
		added: inserted.length,
		focus: input.focus?.trim() ? "yes" : "no",
	});
	return inserted;
};

export const regenerateSuite = async (input: {
	agentId: string;
}): Promise<Test[]> => {
	const agent = await AgentsDal.getAgent({ id: input.agentId });
	if (!agent) throw new NotFoundError("Agent");
	// Regenerate keeps the current agent name — the user may have edited it.
	const content = await generateContent({
		agentNameHint: agent.name,
		description: agent.description,
	});
	const inserted = await TestsDal.replaceSuiteForAgent({
		agentId: agent.id,
		tests: content.tests.map((t) => ({ ...t, agentId: agent.id })),
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

export const listTestRuns = async (input: {
	testId: string;
}): Promise<import("../../database/schemas/runs.ts").Run[]> => {
	const test = await TestsDal.getTest({ id: input.testId });
	if (!test) throw new NotFoundError("Test");
	const rows = await RunsDal.listRunsForTest({ testId: test.id });
	// DAL orders ascending by createdAt; history wants newest first.
	return [...rows].reverse();
};

export const deleteTest = async (input: { id: string }): Promise<void> => {
	const existing = await TestsDal.getTest({ id: input.id });
	if (!existing) throw new NotFoundError("Test");
	await TestsDal.deleteTest({ id: input.id });
	logger.info("test deleted", { testId: input.id, agentId: existing.agentId });
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

const ALLOWED_KINDS: ReadonlySet<string> = new Set([
	"transcript",
	"received_sms",
	"sms_content",
]);

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
		if (c.kind !== undefined && !ALLOWED_KINDS.has(c.kind)) {
			throw new BadRequestError(
				`criterion.kind must be one of transcript, received_sms, sms_content (got "${c.kind}")`,
			);
		}
	}
};
