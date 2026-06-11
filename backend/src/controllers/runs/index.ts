import express from "express";
import { z } from "zod";
import * as RunsBl from "../../bl/runs/index.ts";

const router = express.Router();

const idParamSchema = z.object({ id: z.string().uuid() });

router.get("/runs/:id", async (req, res, next) => {
	try {
		const { id } = idParamSchema.parse(req.params);
		const detail = await RunsBl.getRunResult({ id });
		res.status(200).json(detail);
	} catch (err) {
		next(err);
	}
});

export default router;
