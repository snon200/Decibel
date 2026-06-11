import express from "express";
import { z } from "zod";
import * as CompetitorsBl from "../../bl/competitors/index.ts";

const router = express.Router();

const agentIdParam = z.object({ agentId: z.string().uuid() });
const idParam = z.object({ id: z.string().uuid() });
const provisionBody = z.object({
	platform: z.enum(["vapi", "elevenlabs"]),
});

router.post("/agents/:agentId/competitors", async (req, res, next) => {
	try {
		const { agentId } = agentIdParam.parse(req.params);
		const { platform } = provisionBody.parse(req.body ?? {});
		const competitor = await CompetitorsBl.provisionCompetitor({
			agentId,
			platform,
		});
		res.status(201).json(competitor);
	} catch (err) {
		next(err);
	}
});

router.get("/agents/:agentId/competitors", async (req, res, next) => {
	try {
		const { agentId } = agentIdParam.parse(req.params);
		const competitors = await CompetitorsBl.listCompetitors({ agentId });
		res.status(200).json(competitors);
	} catch (err) {
		next(err);
	}
});

router.get("/agents/:agentId/comparison", async (req, res, next) => {
	try {
		const { agentId } = agentIdParam.parse(req.params);
		const comparison = await CompetitorsBl.compareScores({ agentId });
		res.status(200).json(comparison);
	} catch (err) {
		next(err);
	}
});

router.delete("/competitors/:id", async (req, res, next) => {
	try {
		const { id } = idParam.parse(req.params);
		await CompetitorsBl.teardownCompetitor({ id });
		res.status(204).send();
	} catch (err) {
		next(err);
	}
});

export default router;
