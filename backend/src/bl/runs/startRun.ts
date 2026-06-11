import * as RunsDal from "../../dal/runs.ts";
import * as TestsDal from "../../dal/tests.ts";
import * as AgentsDal from "../../dal/agents.ts";
import { NotFoundError } from "../../lib/errors.ts";
import { logger } from "../../lib/logger.ts";
import { getProvider } from "../../providers/registry.ts";
import { Run } from "./Run.ts";
import {
	resolveCompetitorTarget,
	type CompetitorPlatform,
} from "../competitors/resolveCompetitorTarget.ts";
import type { Run as RunRow, TargetKind } from "../../database/schemas/runs.ts";
import type { PlaceCallInput, ProviderName } from "../../providers/types.ts";

/**
 * Abstract target for a single test/suite run. Competitors are identified by
 * platform name; their phone number + simulation prompt are resolved on the
 * fly (see resolveTarget below).
 */
export type RunTarget =
	| { kind: "user_bot" }
	| { kind: "competitor"; platform: CompetitorPlatform };

/** Concrete dial destination — what startRun actually needs. */
export type ResolvedTarget = {
	kind: TargetKind;
	label: string;
	phoneNumber: string;
};

export const resolveTarget = async (input: {
	agentId: string;
	target: RunTarget;
}): Promise<ResolvedTarget> => {
	if (input.target.kind === "user_bot") {
		const agent = await AgentsDal.getAgent({ id: input.agentId });
		if (!agent) throw new NotFoundError("Agent");
		return {
			kind: "user_bot",
			label: "User bot",
			phoneNumber: agent.phoneNumber,
		};
	}
	const competitor = await resolveCompetitorTarget({
		agentId: input.agentId,
		platform: input.target.platform,
	});
	return {
		kind: "competitor",
		label: competitor.label,
		phoneNumber: competitor.phoneNumber,
	};
};

/**
 * Place an outbound Dial call for a single test against a *pre-resolved*
 * target. Used by runSuite (which resolves once and reuses) and indirectly
 * by startRun (which resolves per call).
 */
export const startRunResolved = async (input: {
	testId: string;
	resolved: ResolvedTarget;
	attemptNumber?: number;
}): Promise<RunRow> => {
	const test = await TestsDal.getTest({ id: input.testId });
	if (!test) throw new NotFoundError("Test");

	const providerName: ProviderName = "dial";
	const runRow = await RunsDal.createRun({
		testId: test.id,
		targetKind: input.resolved.kind,
		targetLabel: input.resolved.label,
		targetPhoneNumber: input.resolved.phoneNumber,
		provider: providerName,
		status: "queued",
		attemptNumber: input.attemptNumber ?? 1,
	});

	const provider = getProvider(providerName);
	const placeCallInput: PlaceCallInput = {
		to: input.resolved.phoneNumber,
		systemPrompt: test.testerInstruction,
		idempotencyKey: runRow.id,
	};

	try {
		const run = new Run({ provider, input: placeCallInput });
		await run.start();
		if (!run.externalCallId) {
			throw new Error("provider.placeCall returned no externalCallId");
		}
		const updated = await RunsDal.setRunCallId({
			id: runRow.id,
			externalCallId: run.externalCallId,
			status: run.status,
		});
		logger.info("run started", {
			runId: runRow.id,
			externalCallId: run.externalCallId,
			testId: test.id,
			targetKind: input.resolved.kind,
		});
		return updated;
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		logger.error("run failed at placeCall", {
			runId: runRow.id,
			error: message,
		});
		const failed = await RunsDal.applyRunUpdate({
			id: runRow.id,
			update: {
				status: "failed",
				error: message,
				completedAt: new Date(),
			},
		});
		return failed;
	}
};

export const startRun = async (input: {
	testId: string;
	target: RunTarget;
}): Promise<RunRow> => {
	const test = await TestsDal.getTest({ id: input.testId });
	if (!test) throw new NotFoundError("Test");
	const resolved = await resolveTarget({
		agentId: test.agentId,
		target: input.target,
	});
	return startRunResolved({ testId: test.id, resolved });
};
