import express from "express";
import { z } from "zod";
import * as AgentsBl from "../../bl/agents/index.ts";

const router = express.Router();

// Strip whitespace, invisible bidi marks, parens, dashes, dots — keep only `+` and digits.
const e164 = z
	.string()
	.transform((s) => s.replace(/[^\d+]/g, ""))
	.pipe(
		z
			.string()
			.regex(
				/^\+[1-9]\d{1,14}$/,
				"Phone must be E.164 (e.g. +14155551234)",
			),
	);

const createAgentSchema = z.object({
	name: z.string().min(1).max(120).optional(),
	phoneNumber: e164,
	description: z.string().min(10).max(2000),
});

const updateAgentSchema = z.object({
	name: z.string().min(1).max(120).optional(),
	phoneNumber: e164.optional(),
	description: z.string().min(10).max(2000).optional(),
});

const idParamSchema = z.object({ id: z.string().uuid() });

router.post("/agents", async (req, res, next) => {
	try {
		const body = createAgentSchema.parse(req.body);
		const result = await AgentsBl.createAgent(body);
		res.status(201).json(result);
	} catch (err) {
		next(err);
	}
});

router.get("/agents", async (_req, res, next) => {
	try {
		const agents = await AgentsBl.listAgents();
		res.status(200).json(agents);
	} catch (err) {
		next(err);
	}
});

router.get("/agents/:id", async (req, res, next) => {
	try {
		const { id } = idParamSchema.parse(req.params);
		const detail = await AgentsBl.getAgent({ id });
		res.status(200).json(detail);
	} catch (err) {
		next(err);
	}
});

router.patch("/agents/:id", async (req, res, next) => {
	try {
		const { id } = idParamSchema.parse(req.params);
		const body = updateAgentSchema.parse(req.body);
		const agent = await AgentsBl.updateAgent({ id, ...body });
		res.status(200).json(agent);
	} catch (err) {
		next(err);
	}
});

router.delete("/agents/:id", async (req, res, next) => {
	try {
		const { id } = idParamSchema.parse(req.params);
		await AgentsBl.deleteAgent({ id });
		res.status(204).send();
	} catch (err) {
		next(err);
	}
});

export default router;
