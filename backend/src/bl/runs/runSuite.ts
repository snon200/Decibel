import * as AgentsDal from "../../dal/agents.ts";
import * as TestsDal from "../../dal/tests.ts";
import { NotFoundError } from "../../lib/errors.ts";
import { runWithConcurrency } from "../../lib/concurrency.ts";
import { logger } from "../../lib/logger.ts";
import { startRun, type RunTarget } from "./startRun.ts";
import type { Run as RunRow } from "../../database/schemas/runs.ts";

const SUITE_CONCURRENCY = 3;

export const runSuite = async (input: {
	agentId: string;
	target: RunTarget;
}): Promise<RunRow[]> => {
	const agent = await AgentsDal.getAgent({ id: input.agentId });
	if (!agent) throw new NotFoundError("Agent");
	const tests = await TestsDal.listTestsForAgent({ agentId: agent.id });
	if (tests.length === 0) return [];

	logger.info("runSuite starting", {
		agentId: agent.id,
		testCount: tests.length,
		targetKind: input.target.kind,
	});

	const runs = await runWithConcurrency(tests, SUITE_CONCURRENCY, async (test) =>
		startRun({ testId: test.id, target: input.target }),
	);
	return runs;
};
