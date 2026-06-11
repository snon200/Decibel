import * as AgentsDal from "../../dal/agents.ts";
import * as CompetitorsDal from "../../dal/competitors.ts";
import { NotFoundError } from "../../lib/errors.ts";
import type { TargetKind } from "../../database/schemas/runs.ts";

export type RunTarget =
	| { kind: "user_bot" }
	| { kind: "competitor"; competitorId: string };

/**
 * Resolve a RunTarget to a concrete dialing destination + label. The user's bot
 * and a provisioned competitor are both just a phone number we dial from Dial.
 */
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
