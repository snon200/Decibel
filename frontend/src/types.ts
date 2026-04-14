export const Currency = {
	USD: "USD",
	ILS: "ILS",
} as const;
export type Currency = (typeof Currency)[keyof typeof Currency];
export const CurrencyArray = Object.values(Currency);

export type Account = {
	accountId: string;
	personId: string;
	balanceAmount: string;
	balanceCurrency: Currency;
	dailyWithdrawalLimitAmount: string;
	dailyWithdrawalLimitCurrency: Currency;
	activeFlag: boolean;
	createDate: string;
};
export type CreateAccountInput = {
	name: string;
	document: string;
	birthDate: string;
	balance: number;
	dailyWithdrawalLimit: number;
	currency: Currency;
};

export type Person = {
	personId: string;
	name: string;
	document: string;
	birthDate: string;
};

export type TransactionType = "deposit" | "withdrawal";
export type Transaction = {
	transactionId: string;
	accountId: string;
	valueAmount: string;
	valueCurrency: Currency;
	transactionDate: string;
	type: TransactionType;
};
export type CreateTransactionInput = {
	accountId: string;
	amount: number;
	currency: Currency;
	type: TransactionType;
};
