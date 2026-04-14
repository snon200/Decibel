import express from "express";
import { z } from "zod";
import AccountsDAL from "../../dal/accounts.ts";
import AccountsBl from "../../bl/accounts.ts";
import { currencySchema } from "../../types.ts";

const router = express.Router();

// GET /accounts - list all account IDs
router.get("/", async (_req, res) => {
	res.status(200).json(await AccountsDAL.getAccountIds());
});

// GET /accounts/:id - get a single account
router.get("/:id", async (req, res) => {
	const accountId = req.params.id;
	const account = await AccountsDAL.getAccountById(accountId);
	if (!account) {
		res.status(404).json({ error: "Account not found" });
		return;
	}
	res.status(200).json(account);
});

const createAccountSchema = z.object({
	balance: z.number(),
	dailyWithdrawalLimit: z.number(),
	currency: currencySchema,
	name: z.string(),
	document: z.string(),
	birthDate: z.string(),
});

// POST /accounts - create a new account
router.post("/", async (req, res) => {
	const parsed = createAccountSchema.safeParse(req.body);
	if (!parsed.success) {
		res.status(400).json({
			error: "Invalid request body",
			details: parsed.error,
		});
		return;
	}
	const { balance, dailyWithdrawalLimit, currency, name, document, birthDate } =
		parsed.data;

	try {
		const account = await AccountsBl.createAccount({
			name,
			document,
			birthDate,
			balance,
			dailyWithdrawalLimit,
			currency,
		});

		res.status(201).json({ accountId: account.accountId });
	} catch (error) {
		res.status(500).json({
			error: error instanceof Error ? error.message : "Internal server error",
		});
		return;
	}
});

// POST /accounts/:id/deactivate - deactivate an account
router.post("/:id/deactivate", async (req, res) => {
	const accountId = req.params.id;

	try {
		await AccountsBl.deactivateAccount(accountId);
	} catch (error) {
		res.status(500).json({
			error: error instanceof Error ? error.message : "Internal server error",
		});
		return;
	}
	res.status(200).end();
});

export default router;
