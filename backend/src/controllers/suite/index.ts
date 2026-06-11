import express from "express";
import { z } from "zod";
import * as SuiteBl from "../../bl/suite/index.ts";
import * as RunsBl from "../../bl/runs/index.ts";

const router = express.Router();

const criterionSchema = z.object({
	id: z.string().min(1),
	text: z.string().min(1),
});

const updateTestSchema = z.object({
	name: z.string().min(1).max(200).optional(),
	scenarioSummary: z.string().min(1).max(2000).optional(),
	testerInstruction: z.string().min(1).max(8000).optional(),
	criteria: z.array(criterionSchema).min(1).max(20).optional(),
});

const runTargetSchema = z
	.union([
		z.object({ kind: z.literal("user_bot") }),
		z.object({
			kind: z.literal("competitor"),
			platform: z.enum(["vapi", "elevenlabs"]),
		}),
	])
	.default({ kind: "user_bot" });

const startRunBodySchema = z.object({
	target: runTargetSchema,
}).default({ target: { kind: "user_bot" } });

const agentIdParam = z.object({ agentId: z.string().uuid() });
const testIdParam = z.object({ id: z.string().uuid() });

router.post("/agents/:agentId/regenerate-suite", async (req, res, next) => {
	try {
		const { agentId } = agentIdParam.parse(req.params);
		const tests = await SuiteBl.regenerateSuite({ agentId });
		res.status(200).json(tests);
	} catch (err) {
		next(err);
	}
});

const addTestsBodySchema = z.object({
	focus: z.string().min(1).max(500).optional(),
	count: z.number().int().min(1).max(8).optional(),
});

router.post("/agents/:agentId/add-tests", async (req, res, next) => {
	try {
		const { agentId } = agentIdParam.parse(req.params);
		const body = addTestsBodySchema.parse(req.body ?? {});
		const tests = await SuiteBl.addTests({ agentId, ...body });
		res.status(201).json(tests);
	} catch (err) {
		next(err);
	}
});

router.get("/agents/:agentId/tests", async (req, res, next) => {
	try {
		const { agentId } = agentIdParam.parse(req.params);
		const tests = await SuiteBl.listTestsForAgent({ agentId });
		res.status(200).json(tests);
	} catch (err) {
		next(err);
	}
});

router.get("/tests/:id/runs", async (req, res, next) => {
	try {
		const { id } = testIdParam.parse(req.params);
		const runs = await SuiteBl.listTestRuns({ testId: id });
		res.status(200).json(runs);
	} catch (err) {
		next(err);
	}
});

router.get("/tests/:id", async (req, res, next) => {
	try {
		const { id } = testIdParam.parse(req.params);
		const test = await SuiteBl.getTest({ id });
		res.status(200).json(test);
	} catch (err) {
		next(err);
	}
});

router.patch("/tests/:id", async (req, res, next) => {
	try {
		const { id } = testIdParam.parse(req.params);
		const body = updateTestSchema.parse(req.body);
		const test = await SuiteBl.updateTest({ id, ...body });
		res.status(200).json(test);
	} catch (err) {
		next(err);
	}
});

router.delete("/tests/:id", async (req, res, next) => {
	try {
		const { id } = testIdParam.parse(req.params);
		await SuiteBl.deleteTest({ id });
		res.status(204).end();
	} catch (err) {
		next(err);
	}
});

router.post("/tests/:id/run", async (req, res, next) => {
	try {
		const { id } = testIdParam.parse(req.params);
		const { target } = startRunBodySchema.parse(req.body ?? {});
		const run = await RunsBl.startRun({ testId: id, target });
		res.status(201).json(run);
	} catch (err) {
		next(err);
	}
});

router.post("/agents/:agentId/run-suite", async (req, res, next) => {
	try {
		const { agentId } = agentIdParam.parse(req.params);
		const { target } = startRunBodySchema.parse(req.body ?? {});
		const runs = await RunsBl.runSuite({ agentId, target });
		res.status(201).json(runs);
	} catch (err) {
		next(err);
	}
});

export default router;
