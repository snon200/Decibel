import * as RunsDal from "../../dal/runs.ts";
import * as TestsDal from "../../dal/tests.ts";
import { getProvider } from "../../providers/registry.ts";
import { runWithConcurrency } from "../../lib/concurrency.ts";
import { NotFoundError } from "../../lib/errors.ts";
import { logger } from "../../lib/logger.ts";
import { resolveTarget, type RunTarget } from "./target.ts";
import type { Run } from "../../database/schemas/runs.ts";

// Every run is a Dial outbound call — to the user's bot or to a competitor's
// number. The tester platform is always Dial.
const TESTER_PROVIDER = "dial" as const;

const MAX_PARALLEL_RUNS = 3;

export const startRun = async (input: {
	testId: string;
	target: RunTarget;
}): Promise<Run> => {
	const test = await TestsDal.getTest({ id: input.testId });
	if (!test) throw new NotFoundError("Test");

	const resolved = await resolveTarget({
		agentId: test.agentId,
		target: input.target,
	});

	const run = await RunsDal.createRun({
		testId: test.id,
		targetKind: resolved.kind,
		targetLabel: resolved.label,
		targetPhoneNumber: resolved.phoneNumber,
		provider: TESTER_PROVIDER,
		status: "queued",
	});

	try {
		const placed = await getProvider(TESTER_PROVIDER).placeCall({
			to: resolved.phoneNumber,
			systemPrompt: test.testerInstruction,
		});
		return await RunsDal.setRunCallId({
			id: run.id,
			externalCallId: placed.externalCallId,
			status: placed.status,
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : "failed to place call";
		logger.error("startRun: placeCall failed", { runId: run.id, error: message });
		return RunsDal.applyRunUpdate({
			id: run.id,
			update: { status: "failed", error: message, completedAt: new Date() },
		});
	}
};

export const runSuite = async (input: {
	agentId: string;
	target: RunTarget;
}): Promise<Run[]> => {
	const tests = await TestsDal.listTestsForAgent({ agentId: input.agentId });
	if (tests.length === 0) throw new NotFoundError("Tests for agent");

	return runWithConcurrency(tests, MAX_PARALLEL_RUNS, (test) =>
		startRun({ testId: test.id, target: input.target }),
	);
};
