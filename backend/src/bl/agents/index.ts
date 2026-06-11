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

export const createAgent = async (input: {
	name: string;
	phoneNumber: string;
	description: string;
}): Promise<{ agent: Agent; tests: Test[]; suiteError?: string }> => {
	const agent = await AgentsDal.createAgent(input);
	// Auto-generate the suite. A generation failure must not lose the agent row,
	// so surface it as `suiteError` and let the user regenerate later.
	try {
		const tests = await SuiteBl.generateFromDescription({
			agentId: agent.id,
			name: agent.name,
			description: agent.description,
		});
		return { agent, tests };
	} catch (err) {
		const suiteError =
			err instanceof Error ? err.message : "suite generation failed";
		logger.error("createAgent: suite generation failed", {
			agentId: agent.id,
			error: suiteError,
		});
		return { agent, tests: [], suiteError };
	}
};

export const getAgent = async (input: { id: string }): Promise<AgentDetail> => {
	const agent = await AgentsDal.getAgent({ id: input.id });
	if (!agent) throw new NotFoundError("Agent");
	const tests = await TestsDal.listTestsForAgent({ agentId: agent.id });
	const allRuns = await RunsDal.listRunsForAgent({ agentId: agent.id });
	const latestRunsByTest: Record<string, Run | null> = {};
	for (const test of tests) latestRunsByTest[test.id] = null;
	// allRuns is ordered by createdAt asc; iterate to keep the most recent per test.
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
	description?: string | undefined;
}): Promise<Agent> => {
	const existing = await AgentsDal.getAgent({ id: input.id });
	if (!existing) throw new NotFoundError("Agent");
	return AgentsDal.updateAgent(input);
};
