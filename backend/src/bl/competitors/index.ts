import * as CompetitorsDal from "../../dal/competitors.ts";
import { NotFoundError } from "../../lib/errors.ts";
import { logger } from "../../lib/logger.ts";
import type { Competitor } from "../../database/schemas/competitors.ts";

export { provisionCompetitor } from "./provisionCompetitor.ts";
export type { CompetitorPlatform } from "./provisionCompetitor.ts";
export { compareScores } from "./compareScores.ts";
export type {
	Comparison,
	ComparisonRow,
	SideResult,
	SideAggregate,
} from "./compareScores.ts";

export const listCompetitors = (input: {
	agentId: string;
}): Promise<Competitor[]> => {
	return CompetitorsDal.listCompetitorsForAgent({ agentId: input.agentId });
};

/** Soft-delete a competitor so it drops out of listings and future suite runs. */
export const teardownCompetitor = async (input: {
	id: string;
}): Promise<void> => {
	const competitor = await CompetitorsDal.getCompetitor({ id: input.id });
	if (!competitor) throw new NotFoundError("Competitor");
	await CompetitorsDal.softDeleteCompetitor({ id: input.id });
	logger.info("competitor torn down", {
		competitorId: input.id,
		platform: competitor.platform,
	});
};
