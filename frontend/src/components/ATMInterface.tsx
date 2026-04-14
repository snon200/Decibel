import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import styled from "styled-components";
import {
	createTransaction,
	deactivateAccount,
	fetchAccountById,
	fetchPersonById,
	fetchTransactionsByAccountId,
} from "../api";
import {
	Currency,
	type CreateTransactionInput,
	type TransactionType,
} from "../types";

type ATMInterfaceProps = {
	accountId: string;
	onShowCreateAccount: () => void;
	onClose: () => void;
};

export default function ATMInterface({
	accountId,
	onShowCreateAccount,
	onClose,
}: ATMInterfaceProps) {
	const queryClient = useQueryClient();

	// Local state
	const [activeTransactionType, setActiveTransactionType] =
		useState<TransactionType>("deposit");
	const [amount, setAmount] = useState<string>("");

	// Queries
	const account = useQuery({
		queryKey: ["account", accountId],
		queryFn: () => fetchAccountById(accountId),
	});
	const person = useQuery({
		queryKey: ["person", account.data?.personId],
		queryFn: () => fetchPersonById(account.data!.personId),
		enabled: !!account.data?.personId,
	});
	const transactions = useQuery({
		queryKey: ["account-transactions", accountId],
		queryFn: () => fetchTransactionsByAccountId(accountId),
	});

	// Derive values from the account query data
	const balance = account.data?.balanceAmount;
	const dailyWithdrawalLimit = account.data?.dailyWithdrawalLimitAmount;
	const currency =
		account.data?.balanceCurrency ??
		account.data?.dailyWithdrawalLimitCurrency ??
		Currency.USD;
	const isActive = account.data?.activeFlag ?? false;

	// Mutations
	const deactivateAccountMutation = useMutation({
		mutationFn: () => deactivateAccount(accountId),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["account", accountId] });
			onClose();
		},
	});
	const createTransactionMutation = useMutation({
		mutationFn: (input: CreateTransactionInput) => createTransaction(input),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: ["account", accountId] });
			void queryClient.invalidateQueries({
				queryKey: ["account-transactions", accountId],
			});
			setAmount("");
		},
	});

	// Handlers
	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const parsed = parseFloat(amount);
		if (isNaN(parsed) || parsed <= 0) return;
		createTransactionMutation.mutate({
			accountId,
			amount: parsed,
			currency,
			type: activeTransactionType,
		});
	};
	const handleDeactivate = () => {
		deactivateAccountMutation.mutate();
	};

	return (
		<Card>
			<Header>
				<div>
					<Title>ATM</Title>
					{person.data && <Greeting>Hello, {person.data.name}</Greeting>}
					{account.data && (
						<AccountId>Account #{account.data.accountId}</AccountId>
					)}
				</div>
				<HeaderActions>
					<CreateAccountButton type="button" onClick={onShowCreateAccount}>
						Create New Account
					</CreateAccountButton>
					<DeactivateButton
						type="button"
						onClick={handleDeactivate}
						disabled={!isActive || deactivateAccountMutation.isPending}
					>
						{deactivateAccountMutation.isPending
							? "Deactivating..."
							: "Deactivate Account"}
					</DeactivateButton>
				</HeaderActions>
			</Header>

			{account.isLoading ? (
				<StatusText>Loading account...</StatusText>
			) : account.error ? (
				<ErrorText>Failed to load account.</ErrorText>
			) : (
				<>
					<Panel>
						<SubtleText>Current Balance</SubtleText>
						<BalanceAmount>
							{balance ? parseFloat(balance).toFixed(2) : "0.00"} {currency}
						</BalanceAmount>
						<SubtleText>
							Daily withdrawal limit:{" "}
							{dailyWithdrawalLimit
								? parseFloat(dailyWithdrawalLimit).toFixed(2)
								: "0.00"}{" "}
							{currency}
						</SubtleText>
					</Panel>

					<Panel>
						{!isActive && (
							<ErrorText>
								Account is inactive. Transactions are disabled.
							</ErrorText>
						)}
						{deactivateAccountMutation.isError && (
							<ErrorText>
								{deactivateAccountMutation.error instanceof Error
									? deactivateAccountMutation.error.message
									: "Failed to deactivate account."}
							</ErrorText>
						)}
						<TypeTabs>
							<TypeTab
								$active={activeTransactionType === "deposit"}
								disabled={!isActive}
								onClick={() => {
									setActiveTransactionType("deposit");
									setAmount("");
									createTransactionMutation.reset();
								}}
							>
								Deposit
							</TypeTab>
							<TypeTab
								$active={activeTransactionType === "withdrawal"}
								disabled={!isActive}
								onClick={() => {
									setActiveTransactionType("withdrawal");
									setAmount("");
									createTransactionMutation.reset();
								}}
							>
								Withdraw
							</TypeTab>
						</TypeTabs>

						<form onSubmit={handleSubmit}>
							<AmountRow>
								<CurrencyLabel>{currency}</CurrencyLabel>
								<AmountInput
									type="number"
									min="0.01"
									step="0.01"
									placeholder="0.00"
									value={amount}
									onChange={(e) => {
										setAmount(e.target.value);
										createTransactionMutation.reset();
									}}
									disabled={!isActive}
									required
								/>
								<SubmitButton
									type="submit"
									disabled={!isActive || createTransactionMutation.isPending}
								>
									{createTransactionMutation.isPending
										? "Processing..."
										: "Confirm"}
								</SubmitButton>
							</AmountRow>
						</form>

						{createTransactionMutation.isSuccess && (
							<SuccessText>
								{activeTransactionType === "deposit" ? "Deposit" : "Withdrawal"}{" "}
								successful
							</SuccessText>
						)}
						{createTransactionMutation.isError && (
							<ErrorText>
								{createTransactionMutation.error instanceof Error
									? createTransactionMutation.error.message
									: "Transaction failed."}
							</ErrorText>
						)}
					</Panel>

					<Panel>
						<HistoryTitle>Recent Transactions</HistoryTitle>
						{transactions.isLoading ? (
							<StatusText>Loading...</StatusText>
						) : (transactions.data ?? []).length === 0 ? (
							<StatusText>No transactions yet.</StatusText>
						) : (
							<HistoryList>
								{[...(transactions.data ?? [])]
									.sort(
										(a, b) =>
											new Date(b.transactionDate).getTime() -
											new Date(a.transactionDate).getTime(),
									)
									.map((tx) => (
										<HistoryRow key={tx.transactionId}>
											<HistoryAmount
												$positive={parseFloat(String(tx.valueAmount)) > 0}
											>
												{parseFloat(String(tx.valueAmount)) > 0 ? "+" : ""}
												{parseFloat(String(tx.valueAmount)).toFixed(2)}{" "}
												{tx.valueCurrency}
											</HistoryAmount>
											<HistoryDate>
												{new Date(tx.transactionDate).toLocaleString()}
											</HistoryDate>
										</HistoryRow>
									))}
							</HistoryList>
						)}
					</Panel>
				</>
			)}
		</Card>
	);
}

const Card = styled.section`
	background: white;
	border: 1px solid rgba(0, 0, 0, 0.2);
	border-radius: 8px;
	padding: 16px;
	display: flex;
	flex-direction: column;
	gap: 16px;
`;

const Header = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
`;

const HeaderActions = styled.div`
	display: flex;
	gap: 8px;
`;

const Title = styled.h2`
	margin: 0;
	font-size: 1.2rem;
`;

const AccountId = styled.span`
	color: #666;
`;

const Greeting = styled.p`
	margin: 4px 0 0 0;
	font-weight: 500;
`;

const CreateAccountButton = styled.button`
	padding: 6px 12px;
	background: transparent;
	border: 1px solid rgba(0, 0, 0, 0.2);
	border-radius: 4px;
	cursor: pointer;

	&:hover {
		background: rgba(0, 0, 0, 0.05);
	}
`;

const DeactivateButton = styled.button`
	padding: 6px 12px;
	background: rgb(239, 68, 68);
	border: 1px solid rgb(239, 68, 68);
	border-radius: 4px;
	color: white;
	cursor: pointer;

	&:hover {
		background: rgb(220, 38, 38);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const Panel = styled.div`
	display: flex;
	flex-direction: column;
	gap: 12px;
	border: 1px solid rgba(0, 0, 0, 0.2);
	border-radius: 8px;
	padding: 12px;
`;

const BalanceAmount = styled.p`
	margin: 4px 0;
	font-size: 1.6rem;
	font-weight: bold;
`;

const SubtleText = styled.p`
	margin: 0;
	font-size: 0.85rem;
	color: rgba(0, 0, 0, 0.6);
`;

const TypeTabs = styled.div`
	display: flex;
	gap: 8px;
`;

const TypeTab = styled.button<{ $active: boolean }>`
	padding: 6px 14px;
	border-radius: 4px;
	border: 1px solid
		${(p) => (p.$active ? "rgb(17, 24, 39)" : "rgb(209, 213, 219)")};
	background: ${(p) => (p.$active ? "rgb(243, 244, 246)" : "transparent")};
	font-weight: ${(p) => (p.$active ? "600" : "400")};
	cursor: pointer;

	&:hover {
		background: ${(p) =>
			p.$active ? "rgb(243, 244, 246)" : "rgba(0, 0, 0, 0.05)"};
	}
`;

const AmountRow = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
`;

const CurrencyLabel = styled.span`
	min-width: 32px;
`;

const AmountInput = styled.input`
	flex: 1;
	padding: 8px 12px;
	border: 1px solid rgba(0, 0, 0, 0.2);
	border-radius: 4px;

	&:focus {
		outline: none;
		border-color: rgb(17, 24, 39);
	}
`;

const SubmitButton = styled.button`
	padding: 8px 14px;
	background: rgb(17, 24, 39);
	color: white;
	border: 1px solid rgb(17, 24, 39);
	border-radius: 4px;
	font-weight: bold;
	cursor: pointer;

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const SuccessText = styled.p`
	margin: 0;
	color: rgb(21, 128, 61);
`;

const ErrorText = styled.p`
	margin: 0;
	color: rgb(220, 38, 38);
`;

const StatusText = styled.p`
	margin: 0;
	color: rgba(0, 0, 0, 0.6);
`;

const HistoryTitle = styled.h4`
	margin: 0;
`;

const HistoryList = styled.ul`
	margin: 0;
	padding: 0 12px;
	display: flex;
	flex-direction: column;
	gap: 8px;
	max-height: 220px;
	overflow-y: auto; // Add vertical scroll for long history
`;

const HistoryRow = styled.li`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 6px 0;
	border-bottom: 1px solid rgba(0, 0, 0, 0.1);

	&:last-child {
		border-bottom: none;
	}
`;

const HistoryAmount = styled.span<{ $positive: boolean }>`
	font-weight: bold;
	color: ${(p) => (p.$positive ? "rgb(166, 227, 161)" : "rgb(243, 139, 168)")};
`;

const HistoryDate = styled.span`
	color: rgb(147, 153, 178);
`;
