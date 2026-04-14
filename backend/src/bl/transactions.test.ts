import { describe, it, mock, beforeEach } from "node:test";
import assert from "node:assert/strict";
import TransactionsBl from "./transactions.ts";
import AccountsDAL from "../dal/accounts.ts";
import TransactionsDAL from "../dal/transactions.ts";

const makeAccount = (overrides: Record<string, unknown> = {}) => ({
	accountId: "account-1",
	personId: "person-1",
	balanceAmount: "1000",
	balanceCurrency: "USD" as const,
	dailyWithdrawalLimitAmount: "500",
	dailyWithdrawalLimitCurrency: "USD" as const,
	activeFlag: true,
	createDate: new Date(),
	...overrides,
});

const makeTransaction = (amount: number, date: Date = new Date()) => ({
	transactionId: `tx-${Math.random()}`,
	accountId: "account-1",
	valueAmount: amount.toString(),
	valueCurrency: "USD" as const,
	transactionDate: date,
});

describe("TransactionsBl", () => {
	beforeEach(() => {
		mock.restoreAll();
	});

	describe("hasExceededDailyWithdrawalLimit", () => {
		it("should return false when no withdrawals today", async () => {
			mock.method(
				TransactionsDAL,
				"getTransactionsByAccountId",
				async () => [],
			);

			const result = await TransactionsBl.hasExceededDailyWithdrawalLimit({
				accountId: "account-1",
				withdrawalAmount: 100,
				dailyLimit: 500,
			});

			assert.equal(result, false);
		});

		it("should return false when withdrawals plus new amount are within limit", async () => {
			mock.method(TransactionsDAL, "getTransactionsByAccountId", async () => [
				makeTransaction(-200), // withdrawn today
			]);

			const result = await TransactionsBl.hasExceededDailyWithdrawalLimit({
				accountId: "account-1",
				withdrawalAmount: 100,
				dailyLimit: 500,
			});

			assert.equal(result, false);
		});

		it("should return true when withdrawals plus new amount exceed limit", async () => {
			mock.method(TransactionsDAL, "getTransactionsByAccountId", async () => [
				makeTransaction(-400),
			]);

			const result = await TransactionsBl.hasExceededDailyWithdrawalLimit({
				accountId: "account-1",
				withdrawalAmount: 200,
				dailyLimit: 500,
			});

			assert.equal(result, true);
		});

		it("should ignore deposits when calculating daily withdrawals", async () => {
			mock.method(TransactionsDAL, "getTransactionsByAccountId", async () => [
				makeTransaction(1000), // deposit - should be ignored
				makeTransaction(-100), // withdrawal
			]);

			const result = await TransactionsBl.hasExceededDailyWithdrawalLimit({
				accountId: "account-1",
				withdrawalAmount: 300,
				dailyLimit: 500,
			});

			assert.equal(result, false);
		});

		it("should ignore withdrawals from previous days", async () => {
			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);

			mock.method(TransactionsDAL, "getTransactionsByAccountId", async () => [
				makeTransaction(-400, yesterday), // yesterday
			]);

			const result = await TransactionsBl.hasExceededDailyWithdrawalLimit({
				accountId: "account-1",
				withdrawalAmount: 400,
				dailyLimit: 500,
			});

			assert.equal(result, false);
		});
	});

	describe("withdrawalChecks", () => {
		it("should throw when insufficient funds", async () => {
			mock.method(
				TransactionsDAL,
				"getTransactionsByAccountId",
				async () => [],
			);

			await assert.rejects(
				() =>
					TransactionsBl.withdrawalChecks({
						accountId: "account-1",
						amount: 200,
						balanceAmount: 100,
						dailyLimit: 500,
					}),
				{ message: "Insufficient funds for withdrawal" },
			);
		});

		it("should throw when daily withdrawal limit exceeded", async () => {
			mock.method(TransactionsDAL, "getTransactionsByAccountId", async () => [
				makeTransaction(-400),
			]);

			await assert.rejects(
				() =>
					TransactionsBl.withdrawalChecks({
						accountId: "account-1",
						amount: 200,
						balanceAmount: 1000,
						dailyLimit: 500,
					}),
				{ message: "Withdrawal amount exceeds daily withdrawal limit" },
			);
		});

		it("should not throw when withdrawal is valid", async () => {
			mock.method(
				TransactionsDAL,
				"getTransactionsByAccountId",
				async () => [],
			);

			await assert.doesNotReject(() =>
				TransactionsBl.withdrawalChecks({
					accountId: "account-1",
					amount: 100,
					balanceAmount: 1000,
					dailyLimit: 500,
				}),
			);
		});
	});

	describe("createTransaction", () => {
		it("should throw when account not found", async () => {
			mock.method(AccountsDAL, "getAccountById", async () => null);

			await assert.rejects(
				() =>
					TransactionsBl.createTransaction({
						accountId: "nonexistent",
						amount: 100,
						type: "deposit",
					}),
				{ message: "Account not found" },
			);
		});

		it("should throw when account is inactive", async () => {
			mock.method(AccountsDAL, "getAccountById", async () =>
				makeAccount({ activeFlag: false }),
			);

			await assert.rejects(
				() =>
					TransactionsBl.createTransaction({
						accountId: "account-1",
						amount: 100,
						type: "deposit",
					}),
				{ message: "Account is inactive" },
			);
		});

		it("should create a deposit and increase balance", async () => {
			mock.method(AccountsDAL, "getAccountById", async () => makeAccount());
			const createTransaction = mock.method(
				TransactionsDAL,
				"createTransaction",
				async () => makeTransaction(100),
			);
			const updateBalance = mock.method(
				AccountsDAL,
				"updateBalance",
				async () => {},
			);

			await TransactionsBl.createTransaction({
				accountId: "account-1",
				amount: 100,
				type: "deposit",
			});

			assert.equal(createTransaction.mock.calls.length, 1);
			const txArg = createTransaction.mock.calls[0]!.arguments[0]!;
			assert.equal(txArg.accountId, "account-1");
			assert.equal(txArg.valueAmount, "100");
			assert.equal(txArg.valueCurrency, "USD");

			assert.equal(updateBalance.mock.calls.length, 1);
			assert.equal(updateBalance.mock.calls[0]!.arguments[0]!, "account-1");
			assert.equal(updateBalance.mock.calls[0]!.arguments[1]!, 1100);
		});

		it("should create a withdrawal and decrease balance", async () => {
			mock.method(AccountsDAL, "getAccountById", async () => makeAccount());
			mock.method(
				TransactionsDAL,
				"getTransactionsByAccountId",
				async () => [],
			);
			const createTransaction = mock.method(
				TransactionsDAL,
				"createTransaction",
				async () => makeTransaction(-100),
			);
			const updateBalance = mock.method(
				AccountsDAL,
				"updateBalance",
				async () => {},
			);

			await TransactionsBl.createTransaction({
				accountId: "account-1",
				amount: 100,
				type: "withdrawal",
			});

			const txArg = createTransaction.mock.calls[0]!.arguments[0]!;
			assert.equal(txArg.valueAmount, "-100");

			assert.equal(updateBalance.mock.calls[0]!.arguments[1]!, 900);
		});

		it("should reject withdrawal with insufficient funds", async () => {
			mock.method(AccountsDAL, "getAccountById", async () =>
				makeAccount({ balanceAmount: "50" }),
			);
			mock.method(
				TransactionsDAL,
				"getTransactionsByAccountId",
				async () => [],
			);

			await assert.rejects(
				() =>
					TransactionsBl.createTransaction({
						accountId: "account-1",
						amount: 100,
						type: "withdrawal",
					}),
				{ message: "Insufficient funds for withdrawal" },
			);
		});
	});
});
