import type {
	Account,
	CreateAccountInput,
	CreateTransactionInput,
	Person,
	Transaction,
} from "./types";

const apiBaseUrl = "http://localhost:3000";

const throwIfNotOk = async (response: Response): Promise<void> => {
	if (response.ok) return;

	const body = (await response.json().catch(() => null)) as {
		error?: string;
	} | null;
	throw new Error(
		body?.error ?? `Request failed with status ${response.status}`,
	);
};

export const fetchAccountIds = async (): Promise<string[]> => {
	const response = await fetch(`${apiBaseUrl}/accounts`);
	await throwIfNotOk(response);

	return (await response.json()) as string[];
};

export const createAccount = async (
	input: CreateAccountInput,
): Promise<string> => {
	const response = await fetch(`${apiBaseUrl}/accounts`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});
	await throwIfNotOk(response);

	return ((await response.json()) as { accountId: string }).accountId;
};

export const fetchAccountById = async (accountId: string): Promise<Account> => {
	const response = await fetch(`${apiBaseUrl}/accounts/${accountId}`);
	await throwIfNotOk(response);

	return (await response.json()) as Account;
};

export const fetchPersonById = async (personId: string): Promise<Person> => {
	const response = await fetch(`${apiBaseUrl}/persons/${personId}`);
	await throwIfNotOk(response);

	return (await response.json()) as Person;
};

export const fetchTransactionsByAccountId = async (
	accountId: string,
): Promise<Transaction[]> => {
	const response = await fetch(`${apiBaseUrl}/transactions/${accountId}`);
	await throwIfNotOk(response);

	return (await response.json()) as Transaction[];
};

export const createTransaction = async (
	input: CreateTransactionInput,
): Promise<void> => {
	const response = await fetch(`${apiBaseUrl}/transactions`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});
	await throwIfNotOk(response);
};

export const deactivateAccount = async (accountId: string): Promise<void> => {
	const response = await fetch(
		`${apiBaseUrl}/accounts/${accountId}/deactivate`,
		{
			method: "POST",
		},
	);
	await throwIfNotOk(response);
};
