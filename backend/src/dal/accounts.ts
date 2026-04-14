import { eq } from "drizzle-orm";
import { db } from "../database/data-source.ts";
import { accounts } from "../database/schemas/accounts.ts";
import type { Account } from "../database/schemas/accounts.ts";

class AccountsDAL {
	static async getAccountIds(): Promise<string[]> {
		const rows = await db
			.select({ accountId: accounts.accountId })
			.from(accounts);
		return rows.map((r) => r.accountId);
	}

	static async getAccountById(accountId: string): Promise<Account | null> {
		const [account] = await db
			.select()
			.from(accounts)
			.where(eq(accounts.accountId, accountId))
			.limit(1);

		return account ?? null;
	}

	static async createAccount(
		account: Omit<Account, "accountId">,
	): Promise<Account> {
		const [saved] = await db.insert(accounts).values(account).returning();

		if (!saved) throw new Error("Failed to create account");

		return saved;
	}

	static async updateBalance(
		accountId: string,
		newAmount: number,
	): Promise<void> {
		await db
			.update(accounts)
			.set({ balanceAmount: newAmount.toString() })
			.where(eq(accounts.accountId, accountId));
	}

	static async updateActiveFlag(
		accountId: string,
		activeFlag: boolean,
	): Promise<void> {
		await db
			.update(accounts)
			.set({ activeFlag })
			.where(eq(accounts.accountId, accountId));
	}
}

export default AccountsDAL;
