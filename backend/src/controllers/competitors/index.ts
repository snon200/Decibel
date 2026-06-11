import express from "express";
import { z } from "zod";
import * as CompetitorsBl from "../../bl/competitors/index.ts";

const router = express.Router();

const agentIdParam = z.object({ agentId: z.string().uuid() });

/**
 * Available competitor platforms — hardcoded list (VAPI, ElevenLabs).
 * The frontend reads this to populate the "Run against competitor" picker.
 */
router.get("/competitors/platforms", (_req, res) => {
	res.status(200).json(CompetitorsBl.listAvailablePlatforms());
});

/**
 * Side-by-side scorecard for the agent's latest user-bot run vs latest run
 * against each competitor platform per test.
 */
router.get("/agents/:agentId/comparison", async (req, res, next) => {
	try {
		const { agentId } = agentIdParam.parse(req.params);
		const comparison = await CompetitorsBl.compareScores({ agentId });
		res.status(200).json(comparison);
	} catch (err) {
		next(err);
	}
});

export default router;
