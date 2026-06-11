import * as AgentsDal from "../../dal/agents.ts";
import { config } from "../../config/env.ts";
import { BadRequestError, NotFoundError } from "../../lib/errors.ts";
import { logger } from "../../lib/logger.ts";
import { hostInboundAgent, listPlatformNumbers } from "../agents/hostInboundAgent.ts";
import { buildSimulationPrompt } from "./buildSimulationPrompt.ts";

/**
 * Hardcoded set of competitor platforms (Dial is reserved for the tester).
 * Add a new entry here + a matching label + env keys to introduce another.
 */
export const COMPETITOR_PLATFORMS = ["vapi", "elevenlabs"] as const;

export type CompetitorPlatform = (typeof COMPETITOR_PLATFORMS)[number];

export const COMPETITOR_LABELS: Record<CompetitorPlatform, string> = {
	vapi: "VAPI",
	elevenlabs: "ElevenLabs Convai",
};

export const isCompetitorPlatform = (s: string): s is CompetitorPlatform =>
	(COMPETITOR_PLATFORMS as readonly string[]).includes(s);

const PLATFORM_NUMBER_ID: Record<CompetitorPlatform, string | undefined> = {
	vapi: config.VAPI_PHONE_NUMBER_ID,
	elevenlabs: config.ELEVENLABS_PHONE_NUMBER_ID,
};

const resolveNumberId = async (
	platform: CompetitorPlatform,
): Promise<string> => {
	const configured = PLATFORM_NUMBER_ID[platform];
	if (configured) return configured;
	const numbers = await listPlatformNumbers(platform);
	const first = numbers[0]?.id;
	if (!first) {
		throw new BadRequestError(
			`No phone number available on ${platform}. Set ${platform.toUpperCase()}_PHONE_NUMBER_ID or import a number on that platform.`,
		);
	}
	return first;
};

/**
 * Resolve a competitor target into a concrete dial destination.
 * Each call:
 *   1. generates a fresh simulation prompt from the agent's current description
 *   2. configures the platform's inbound number with that prompt
 *   3. returns the dialable phone number
 * Call this once per suite run, not per test.
 */
export const resolveCompetitorTarget = async (input: {
	agentId: string;
	platform: CompetitorPlatform;
}): Promise<{ label: string; phoneNumber: string }> => {
	const agent = await AgentsDal.getAgent({ id: input.agentId });
	if (!agent) throw new NotFoundError("Agent");

	const simulationPrompt = await buildSimulationPrompt({
		name: agent.name,
		description: agent.description,
	});

	const numberId = await resolveNumberId(input.platform);
	const number = await hostInboundAgent({
		platform: input.platform,
		numberId,
		systemPrompt: simulationPrompt,
	});
	if (!number.phoneNumber) {
		throw new BadRequestError(
			`${input.platform} number ${numberId} has no dialable E.164 phone number.`,
		);
	}

	logger.info("competitor target resolved", {
		agentId: agent.id,
		platform: input.platform,
		phoneNumber: number.phoneNumber,
	});

	return {
		label: COMPETITOR_LABELS[input.platform],
		phoneNumber: number.phoneNumber,
	};
};
