import AccountsDAL from "../dal/accounts.ts";
import PersonsDAL from "../dal/persons.ts";
import type { Currency } from "../types.ts";

/**
 * This class contains the business logic for accounts.
 */
class AccountsBl {
	/**
	 * This function creates a new account and the associated person.
	 * It returns the created account.
	 */
	static async createAccount(params: {
		name: string;
		document: string;
		birthDate: string;
		balance: number;
		dailyWithdrawalLimit: number;
		currency: Currency;
	}) {
		const {
			name,
			document,
			birthDate,
			balance,
			dailyWithdrawalLimit,
			currency,
		} = params;

		const person = await PersonsDAL.createPerson({
			name,
			document,
			birthDate: new Date(birthDate),
		});
		const account = await AccountsDAL.createAccount({
			personId: person.personId,
			balanceAmount: balance.toString(),
			balanceCurrency: currency,
			dailyWithdrawalLimitAmount: dailyWithdrawalLimit.toString(),
			dailyWithdrawalLimitCurrency: currency,
			activeFlag: true,
			createDate: new Date(),
		});
		return account;
	}

	/**
	 * This function deactivates an account by setting its activeFlag to false.
	 */
	static async deactivateAccount(accountId: string) {
		await AccountsDAL.updateActiveFlag(accountId, false);
	}
}

export default AccountsBl;
