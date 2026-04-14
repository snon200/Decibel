import express from "express";
import { z } from "zod";
import TransactionsDAL from "../../dal/transactions.ts";
import TransactionsBl from "../../bl/transactions.ts";

const router = express.Router();

// GET /transactions/:accountId - get transactions for an account
router.get("/:accountId", async (req, res) => {
	const accountId = req.params.accountId;
	res
		.status(200)
		.json(await TransactionsDAL.getTransactionsByAccountId(accountId));
});

const createTransactionSchema = z.object({
	accountId: z.string().uuid(),
	amount: z.number().positive(),
	type: z.enum(["deposit", "withdrawal"]),
});

// POST /transactions - create a transaction and update account balance
router.post("/", async (req, res) => {
	const parsed = createTransactionSchema.safeParse(req.body);
	if (!parsed.success) {
		res
			.status(400)
			.json({ error: "Invalid request body", details: parsed.error });
		return;
	}
	const { accountId, amount, type } = parsed.data;

	try {
		await TransactionsBl.createTransaction({ accountId, amount, type });
	} catch (error) {
		res.status(500).json({
			error: error instanceof Error ? error.message : "Internal server error",
		});
		return;
	}

	res.status(201).end();
});

export default router;
