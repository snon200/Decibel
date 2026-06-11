import * as AgentsDal from "../../dal/agents.ts";
import * as TestsDal from "../../dal/tests.ts";
import * as RunsDal from "../../dal/runs.ts";
import * as SuiteBl from "../suite/index.ts";
import { NotFoundError } from "../../lib/errors.ts";
import { logger } from "../../lib/logger.ts";
import type { Agent } from "../../database/schemas/agents.ts";
import type { Test } from "../../database/schemas/tests.ts";
import type { Run } from "../../database/schemas/runs.ts";

export type AgentDetail = {
	agent: Agent;
	tests: Test[];
	latestRunsByTest: Record<string, Run | null>;
};

const fallbackName = (description: string): string => {
	const cleaned = description.trim().replace(/\s+/g, " ");
	if (cleaned.length <= 48) return cleaned || "Untitled agent";
	const sliced = cleaned.slice(0, 48);
	const lastSpace = sliced.lastIndexOf(" ");
	return (lastSpace > 16 ? sliced.slice(0, lastSpace) : sliced) + "…";
};

export const createAgent = async (input: {
	name?: string | undefined;
	phoneNumber: string;
	description: string;
}): Promise<{ agent: Agent; tests: Test[]; suiteError?: string }> => {
	// Single LLM call: generate the agent name (unless the user supplied one)
	// AND the test suite. Then persist atomically.
	let content: SuiteBl.GeneratedContent | null = null;
	let suiteError: string | undefined;
	try {
		content = await SuiteBl.generateContent({
			...(input.name ? { agentNameHint: input.name } : {}),
			description: input.description,
		});
	} catch (err) {
		suiteError = err instanceof Error ? err.message : String(err);
		logger.error("suite generation failed during createAgent", {
			error: suiteError,
		});
	}

	const name =
		input.name?.trim() ||
		content?.agentName?.trim() ||
		fallbackName(input.description);

	const agent = await AgentsDal.createAgent({
		name,
		phoneNumber: input.phoneNumber,
		description: input.description,
	});

	if (!content) {
		return { agent, tests: [], ...(suiteError ? { suiteError } : {}) };
	}

	const tests = await TestsDal.bulkCreateTests({
		tests: content.tests.map((t) => ({ ...t, agentId: agent.id })),
	});
	logger.info("agent + suite created", {
		agentId: agent.id,
		testCount: tests.length,
		nameSource: input.name ? "user" : content.agentName ? "llm" : "fallback",
	});
	return { agent, tests };
};

export const getAgent = async (input: { id: string }): Promise<AgentDetail> => {
	const agent = await AgentsDal.getAgent({ id: input.id });
	if (!agent) throw new NotFoundError("Agent");
	const tests = await TestsDal.listTestsForAgent({ agentId: agent.id });
	const allRuns = await RunsDal.listRunsForAgent({ agentId: agent.id });
	const latestRunsByTest: Record<string, Run | null> = {};
	for (const test of tests) latestRunsByTest[test.id] = null;
	for (const run of allRuns) {
		latestRunsByTest[run.testId] = run;
	}
	return { agent, tests, latestRunsByTest };
};

export const listAgents = async (): Promise<Agent[]> => {
	return AgentsDal.listAgents();
};

export const updateAgent = async (input: {
	id: string;
	name?: string | undefined;
	phoneNumber?: string | undefined;
	description?: string | undefined;
}): Promise<Agent> => {
	const existing = await AgentsDal.getAgent({ id: input.id });
	if (!existing) throw new NotFoundError("Agent");
	return AgentsDal.updateAgent(input);
};
