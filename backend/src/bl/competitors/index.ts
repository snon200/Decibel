export {
	COMPETITOR_PLATFORMS,
	COMPETITOR_LABELS,
	isCompetitorPlatform,
	resolveCompetitorTarget,
} from "./resolveCompetitorTarget.ts";
export type { CompetitorPlatform } from "./resolveCompetitorTarget.ts";

export { buildSimulationPrompt } from "./buildSimulationPrompt.ts";

export { compareScores } from "./compareScores.ts";
export type {
	Comparison,
	ComparisonRow,
	SideResult,
	SideAggregate,
} from "./compareScores.ts";

import {
	COMPETITOR_PLATFORMS,
	COMPETITOR_LABELS,
} from "./resolveCompetitorTarget.ts";

export const listAvailablePlatforms = () =>
	COMPETITOR_PLATFORMS.map((platform) => ({
		platform,
		label: COMPETITOR_LABELS[platform],
	}));
