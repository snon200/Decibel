import * as RunsDal from "../../dal/runs.ts";
import * as TestsDal from "../../dal/tests.ts";
import * as AgentsDal from "../../dal/agents.ts";
import * as CompetitorsDal from "../../dal/competitors.ts";
import { NotFoundError } from "../../lib/errors.ts";
import { logger } from "../../lib/logger.ts";
import { config } from "../../config/env.ts";
import { getProvider } from "../../providers/registry.ts";
import { Run } from "./Run.ts";
import type { Run as RunRow, TargetKind } from "../../database/schemas/runs.ts";
import type { PlaceCallInput, ProviderName } from "../../providers/types.ts";

export type RunTarget =
	| { kind: "user_bot" }
	| { kind: "competitor"; competitorId: string };

export const resolveTarget = async (input: {
	agentId: string;
	target: RunTarget;
}): Promise<{ kind: TargetKind; label: string; phoneNumber: string }> => {
	if (input.target.kind === "user_bot") {
		const agent = await AgentsDal.getAgent({ id: input.agentId });
		if (!agent) throw new NotFoundError("Agent");
		return {
			kind: "user_bot",
			label: "User bot",
			phoneNumber: agent.phoneNumber,
		};
	}
	const competitor = await CompetitorsDal.getCompetitor({
		id: input.target.competitorId,
	});
	if (!competitor) throw new NotFoundError("Competitor");
	return {
		kind: "competitor",
		label: competitor.platform,
		phoneNumber: competitor.phoneNumber,
	};
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

	const providerName: ProviderName = "dial";
	const runRow = await RunsDal.createRun({
		testId: test.id,
		targetKind: resolved.kind,
		targetLabel: resolved.label,
		targetPhoneNumber: resolved.phoneNumber,
		provider: providerName,
		status: "queued",
	});

	const provider = getProvider(providerName);
	const placeCallInput: PlaceCallInput = {
		to: resolved.phoneNumber,
		systemPrompt: test.testerInstruction,
		idempotencyKey: runRow.id,
		...(config.PUBLIC_BASE_URL
			? { webhookUrl: `${config.PUBLIC_BASE_URL}/webhooks/dial` }
			: {}),
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
			targetKind: resolved.kind,
		});
		return updated;
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		logger.error("run failed at placeCall", { runId: runRow.id, error: message });
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
