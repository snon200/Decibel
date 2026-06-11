import * as AgentsDal from "../../dal/agents.ts";
import * as TestsDal from "../../dal/tests.ts";
import { NotFoundError } from "../../lib/errors.ts";
import { runWithConcurrency } from "../../lib/concurrency.ts";
import { logger } from "../../lib/logger.ts";
import { resolveTarget, startRunResolved, type RunTarget } from "./startRun.ts";
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

	// Resolve the target once so we don't reconfigure the competitor inbound
	// or look up the agent N times.
	const resolved = await resolveTarget({
		agentId: agent.id,
		target: input.target,
	});

	logger.info("runSuite starting", {
		agentId: agent.id,
		testCount: tests.length,
		targetKind: resolved.kind,
		targetLabel: resolved.label,
	});

	const runs = await runWithConcurrency(tests, SUITE_CONCURRENCY, (test) =>
		startRunResolved({ testId: test.id, resolved }),
	);
	return runs;
};
