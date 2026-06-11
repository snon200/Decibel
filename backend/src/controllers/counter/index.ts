import express from "express";
import * as CounterBl from "../../bl/counter.ts";

const router = express.Router();

router.get("/", async (_req, res) => {
	const row = await CounterBl.getCounter();
	res.status(200).json(row);
});

router.post("/increment", async (_req, res) => {
	const row = await CounterBl.incrementCounter();
	res.status(200).json(row);
});

router.post("/decrement", async (_req, res) => {
	const row = await CounterBl.decrementCounter();
	res.status(200).json(row);
});

export default router;
