import * as AgentsDal from "../../dal/agents.ts";
import * as CompetitorsDal from "../../dal/competitors.ts";
import { config } from "../../config/env.ts";
import { BadRequestError, NotFoundError } from "../../lib/errors.ts";
import { logger } from "../../lib/logger.ts";
import { hostInboundAgent, listPlatformNumbers } from "../agents/hostInboundAgent.ts";
import { buildSimulationPrompt } from "./buildSimulationPrompt.ts";
import type { Competitor } from "../../database/schemas/competitors.ts";

/** Platforms a competitor can be hosted on (Dial is reserved for the tester). */
export type CompetitorPlatform = "vapi" | "elevenlabs";

const PLATFORM_NUMBER_ID: Record<CompetitorPlatform, string | undefined> = {
	vapi: config.VAPI_PHONE_NUMBER_ID,
	elevenlabs: config.ELEVENLABS_PHONE_NUMBER_ID,
};

const PLATFORM_AGENT_ID: Record<CompetitorPlatform, string | undefined> = {
	vapi: config.VAPI_ASSISTANT_ID,
	elevenlabs: config.ELEVENLABS_AGENT_ID,
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
 * Provision a competitor: turn the user's agent description into a simulation
 * prompt, host it on the competitor platform's inbound number, and persist the
 * competitor so the suite can be dialed against it.
 */
export const provisionCompetitor = async (input: {
	agentId: string;
	platform: CompetitorPlatform;
}): Promise<Competitor> => {
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

	const competitor = await CompetitorsDal.createCompetitor({
		agentId: agent.id,
		platform: input.platform,
		externalAgentId: PLATFORM_AGENT_ID[input.platform] ?? number.id,
		phoneNumber: number.phoneNumber,
		simulationPrompt,
	});

	logger.info("competitor provisioned", {
		agentId: agent.id,
		competitorId: competitor.id,
		platform: input.platform,
		phoneNumber: number.phoneNumber,
	});
	return competitor;
};
