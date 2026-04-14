import { describe, it, mock, beforeEach } from "node:test";
import assert from "node:assert/strict";
import AccountsBl from "./accounts.ts";
import AccountsDAL from "../dal/accounts.ts";
import PersonsDAL from "../dal/persons.ts";

describe("AccountsBl", () => {
	beforeEach(() => {
		mock.restoreAll();
	});

	describe("createAccount", () => {
		it("should create a person and an account with correct params", async () => {
			const fakePerson = {
				personId: "person-1",
				name: "John",
				document: "123",
				birthDate: new Date("1990-01-01"),
			};
			const fakeAccount = {
				accountId: "account-1",
				personId: "person-1",
				balanceAmount: "100",
				balanceCurrency: "USD" as const,
				dailyWithdrawalLimitAmount: "500",
				dailyWithdrawalLimitCurrency: "USD" as const,
				activeFlag: true,
				createDate: new Date(),
			};

			const createPerson = mock.method(
				PersonsDAL,
				"createPerson",
				async () => fakePerson,
			);
			const createAccount = mock.method(
				AccountsDAL,
				"createAccount",
				async () => fakeAccount,
			);

			const result = await AccountsBl.createAccount({
				name: "John",
				document: "123",
				birthDate: "1990-01-01",
				balance: 100,
				dailyWithdrawalLimit: 500,
				currency: "USD",
			});

			assert.equal(createPerson.mock.calls.length, 1);
			const personArg = createPerson.mock.calls[0]!.arguments[0]!;
			assert.equal(personArg.name, "John");
			assert.equal(personArg.document, "123");
			assert.deepEqual(personArg.birthDate, new Date("1990-01-01"));

			assert.equal(createAccount.mock.calls.length, 1);
			const accountArg = createAccount.mock.calls[0]!.arguments[0]!;
			assert.equal(accountArg.personId, "person-1");
			assert.equal(accountArg.balanceAmount, "100");
			assert.equal(accountArg.balanceCurrency, "USD");
			assert.equal(accountArg.dailyWithdrawalLimitAmount, "500");
			assert.equal(accountArg.dailyWithdrawalLimitCurrency, "USD");
			assert.equal(accountArg.activeFlag, true);

			assert.equal(result.accountId, "account-1");
		});

		it("should handle zero balance and zero daily limit", async () => {
			const fakePerson = {
				personId: "person-1",
				name: "Jane",
				document: "456",
				birthDate: new Date("2000-06-15"),
			};
			const fakeAccount = {
				accountId: "account-2",
				personId: "person-1",
				balanceAmount: "0",
				balanceCurrency: "ILS" as const,
				dailyWithdrawalLimitAmount: "0",
				dailyWithdrawalLimitCurrency: "ILS" as const,
				activeFlag: true,
				createDate: new Date(),
			};

			mock.method(PersonsDAL, "createPerson", async () => fakePerson);
			const createAccount = mock.method(
				AccountsDAL,
				"createAccount",
				async () => fakeAccount,
			);

			const result = await AccountsBl.createAccount({
				name: "Jane",
				document: "456",
				birthDate: "2000-06-15",
				balance: 0,
				dailyWithdrawalLimit: 0,
				currency: "ILS",
			});

			const accountArg = createAccount.mock.calls[0]!.arguments[0]!;
			assert.equal(accountArg.balanceAmount, "0");
			assert.equal(accountArg.dailyWithdrawalLimitAmount, "0");
			assert.equal(accountArg.balanceCurrency, "ILS");
			assert.equal(result.accountId, "account-2");
		});

		it("should propagate error when person creation fails", async () => {
			mock.method(PersonsDAL, "createPerson", async () => {
				throw new Error("Failed to create person");
			});
			const createAccount = mock.method(
				AccountsDAL,
				"createAccount",
				async () => ({}),
			);

			await assert.rejects(
				() =>
					AccountsBl.createAccount({
						name: "John",
						document: "123",
						birthDate: "1990-01-01",
						balance: 100,
						dailyWithdrawalLimit: 500,
						currency: "USD",
					}),
				{ message: "Failed to create person" },
			);

			assert.equal(createAccount.mock.calls.length, 0);
		});

		it("should propagate error when account creation fails", async () => {
			mock.method(PersonsDAL, "createPerson", async () => ({
				personId: "person-1",
				name: "John",
				document: "123",
				birthDate: new Date("1990-01-01"),
			}));
			mock.method(AccountsDAL, "createAccount", async () => {
				throw new Error("Failed to create account");
			});

			await assert.rejects(
				() =>
					AccountsBl.createAccount({
						name: "John",
						document: "123",
						birthDate: "1990-01-01",
						balance: 100,
						dailyWithdrawalLimit: 500,
						currency: "USD",
					}),
				{ message: "Failed to create account" },
			);
		});

		it("should convert balance with decimal precision to string", async () => {
			mock.method(PersonsDAL, "createPerson", async () => ({
				personId: "person-1",
				name: "John",
				document: "123",
				birthDate: new Date("1990-01-01"),
			}));
			const createAccount = mock.method(
				AccountsDAL,
				"createAccount",
				async () => ({
					accountId: "account-1",
					personId: "person-1",
					balanceAmount: "99.99",
					balanceCurrency: "USD" as const,
					dailyWithdrawalLimitAmount: "1000.5",
					dailyWithdrawalLimitCurrency: "USD" as const,
					activeFlag: true,
					createDate: new Date(),
				}),
			);

			await AccountsBl.createAccount({
				name: "John",
				document: "123",
				birthDate: "1990-01-01",
				balance: 99.99,
				dailyWithdrawalLimit: 1000.5,
				currency: "USD",
			});

			const accountArg = createAccount.mock.calls[0]!.arguments[0]!;
			assert.equal(accountArg.balanceAmount, "99.99");
			assert.equal(accountArg.dailyWithdrawalLimitAmount, "1000.5");
		});
	});

	describe("deactivateAccount", () => {
		it("should call updateActiveFlag with false", async () => {
			const updateActiveFlag = mock.method(
				AccountsDAL,
				"updateActiveFlag",
				async () => {},
			);

			await AccountsBl.deactivateAccount("account-1");

			assert.equal(updateActiveFlag.mock.calls.length, 1);
			assert.equal(updateActiveFlag.mock.calls[0]!.arguments[0], "account-1");
			assert.equal(updateActiveFlag.mock.calls[0]!.arguments[1], false);
		});

		it("should propagate error when updateActiveFlag fails", async () => {
			mock.method(AccountsDAL, "updateActiveFlag", async () => {
				throw new Error("Account not found");
			});

			await assert.rejects(() => AccountsBl.deactivateAccount("nonexistent"), {
				message: "Account not found",
			});
		});
	});
});
