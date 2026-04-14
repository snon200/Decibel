import AccountsDAL from "../dal/accounts.ts";
import TransactionsDAL from "../dal/transactions.ts";

/**
 * This class contains the business logic for transactions.
 */
class TransactionsBl {
	/**
	 * Returns true when today's existing withdrawals plus the requested withdrawal
	 * exceed the account's configured daily withdrawal limit
	 */
	static hasExceededDailyWithdrawalLimit(params: {
		accountId: string;
		withdrawalAmount: number;
		dailyLimit: number;
	}): Promise<boolean> {
		const { accountId, withdrawalAmount, dailyLimit } = params;
		const now = new Date();

		return TransactionsDAL.getTransactionsByAccountId(accountId).then(
			(transactions) => {
				const withdrawnToday = transactions
					.filter(
						(tx) =>
							Number(tx.valueAmount) < 0 &&
							tx.transactionDate.getFullYear() === now.getFullYear() &&
							tx.transactionDate.getMonth() === now.getMonth() &&
							tx.transactionDate.getDate() === now.getDate(),
					)
					.reduce((sum, tx) => sum + Math.abs(Number(tx.valueAmount)), 0);

				return withdrawnToday + withdrawalAmount > dailyLimit;
			},
		);
	}

	/**
	 * Runs all withdrawal-specific validations before creating a transaction
	 */
	static async withdrawalChecks(params: {
		accountId: string;
		amount: number;
		balanceAmount: number;
		dailyLimit: number;
	}) {
		const { accountId, amount, balanceAmount, dailyLimit } = params;

		const insufficientFunds = balanceAmount < amount;
		if (insufficientFunds) throw new Error("Insufficient funds for withdrawal");

		const exceedsDailyLimit =
			await TransactionsBl.hasExceededDailyWithdrawalLimit({
				accountId,
				withdrawalAmount: amount,
				dailyLimit,
			});
		if (exceedsDailyLimit)
			throw new Error("Withdrawal amount exceeds daily withdrawal limit");
	}

	/**
	 * This function creates a transaction and updates the account balance accordingly
	 * It performs necessary validations and throws errors if any issues are encountered
	 */
	static async createTransaction(params: {
		accountId: string;
		amount: number;
		type: "deposit" | "withdrawal";
	}) {
		const { accountId, amount, type } = params;

		const account = await AccountsDAL.getAccountById(accountId);
		if (!account) throw new Error("Account not found");
		if (!account.activeFlag) throw new Error("Account is inactive");

		const currentBalance = Number(account.balanceAmount);
		const dailyLimit = Number(account.dailyWithdrawalLimitAmount);

		// Calculate the new account balance
		// For withdrawals, check for sufficient funds and daily withdrawal limit
		let newBalanceAmount = currentBalance;
		if (type === "withdrawal") {
			await TransactionsBl.withdrawalChecks({
				accountId,
				amount,
				balanceAmount: currentBalance,
				dailyLimit,
			});

			newBalanceAmount = currentBalance - amount;
		} else {
			newBalanceAmount = currentBalance + amount;
		}

		// Create the transaction and update the account balance
		await TransactionsDAL.createTransaction({
			accountId,
			valueAmount: (type === "withdrawal" ? -amount : amount).toString(),
			valueCurrency: account.balanceCurrency,
			transactionDate: new Date(),
		});
		await AccountsDAL.updateBalance(accountId, newBalanceAmount);
	}
}

export default TransactionsBl;
