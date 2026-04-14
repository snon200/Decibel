import { desc, eq } from "drizzle-orm";
import { db } from "../database/data-source.ts";
import { transactions } from "../database/schemas/transactions.ts";
import type { Transaction } from "../database/schemas/transactions.ts";

class TransactionsDAL {
	static async getTransactionsByAccountId(
		accountId: string,
	): Promise<Transaction[]> {
		return db
			.select()
			.from(transactions)
			.where(eq(transactions.accountId, accountId))
			.orderBy(desc(transactions.transactionDate));
	}

	static async createTransaction(
		transaction: Omit<Transaction, "transactionId">,
	): Promise<Transaction> {
		const [saved] = await db
			.insert(transactions)
			.values(transaction)
			.returning();

		if (!saved) throw new Error("Failed to create transaction");

		return saved;
	}
}

export default TransactionsDAL;
