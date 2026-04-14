import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import styled from "styled-components";
import { createAccount } from "../api";
import { Currency, CurrencyArray, type CreateAccountInput } from "../types";
import { ACCOUNT_IDS_QUERY_KEY } from "./AccountList";

const defaultForm: CreateAccountInput = {
	name: "",
	document: "",
	birthDate: "",
	balance: 0,
	dailyWithdrawalLimit: 0,
	currency: Currency.USD,
};

export default function CreateAccountForm({
	onAccountCreated,
}: {
	onAccountCreated?: (accountId: string) => void;
}) {
	const queryClient = useQueryClient();

	// Local state for form inputs
	const [form, setForm] = useState<CreateAccountInput>(defaultForm);

	// Mutation for creating account
	const createAccountMutation = useMutation({
		mutationFn: createAccount,
		onSuccess: (accountId) => {
			void queryClient.invalidateQueries({ queryKey: ACCOUNT_IDS_QUERY_KEY });
			setForm(defaultForm);
			onAccountCreated?.(accountId);
		},
	});

	// Handler for form submission
	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		createAccountMutation.mutate(form);
	};

	return (
		<FormContainer>
			<FormTitle>Create Account</FormTitle>

			{createAccountMutation.isSuccess && (
				<SuccessMessage>Account created successfully.</SuccessMessage>
			)}
			{createAccountMutation.isError && (
				<ErrorMessage>
					{createAccountMutation.error instanceof Error
						? createAccountMutation.error.message
						: "Unknown error"}
				</ErrorMessage>
			)}

			<Form onSubmit={handleSubmit}>
				<FieldGroup>
					<legend>Account Info</legend>
					<Field>
						<label>Currency</label>
						<select
							value={form.currency}
							onChange={(e) =>
								setForm({ ...form, currency: e.target.value as Currency })
							}
							required
						>
							{CurrencyArray.map((currency) => (
								<option key={currency} value={currency}>
									{currency}
								</option>
							))}
						</select>
					</Field>
					<Field>
						<label>Balance</label>
						<input
							type="number"
							value={form.balance}
							onChange={(e) =>
								setForm({
									...form,
									balance: Number(e.target.value),
								})
							}
							required
						/>
					</Field>

					<Field>
						<label>Daily Withdrawal Limit</label>
						<input
							type="number"
							min={0}
							value={form.dailyWithdrawalLimit}
							onChange={(e) =>
								setForm({
									...form,
									dailyWithdrawalLimit: Number(e.target.value),
								})
							}
							required
						/>
					</Field>
				</FieldGroup>

				<FieldGroup>
					<legend>Personal Details</legend>
					<Field>
						<label>Name</label>
						<input
							type="text"
							value={form.name}
							onChange={(e) => setForm({ ...form, name: e.target.value })}
							required
						/>
					</Field>
					<Field>
						<label>Document</label>
						<input
							type="text"
							value={form.document}
							onChange={(e) => setForm({ ...form, document: e.target.value })}
							required
						/>
					</Field>
					<Field>
						<label>Birth Date</label>
						<input
							type="date"
							value={form.birthDate}
							onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
							required
						/>
					</Field>
				</FieldGroup>

				<SubmitButton type="submit" disabled={createAccountMutation.isPending}>
					{createAccountMutation.isPending ? "Creating..." : "Create Account"}
				</SubmitButton>
			</Form>
		</FormContainer>
	);
}

const FormContainer = styled.section`
	display: flex;
	flex-direction: column;
	gap: 12px;
`;

const FormTitle = styled.h2`
	margin: 0;
	font-size: 1rem;
`;

const Form = styled.form`
	display: flex;
	flex-direction: column;
	gap: 12px;
`;

const FieldGroup = styled.fieldset`
	background: white;
	display: flex;
	flex-direction: column;
	gap: 12px;
`;

const Field = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;

	label {
		font-size: 0.85rem;
	}

	input,
	select {
		padding: 6px 10px;
		border: 1px solid rgba(0, 0, 0, 0.2);
		border-radius: 4px;
		font-size: 0.95rem;
		font-family: inherit;
	}
`;

const SubmitButton = styled.button`
	padding: 8px 14px;
	background: transparent;
	color: inherit;
	border: 1px solid rgba(0, 0, 0, 0.2);
	border-radius: 4px;
	font-size: 0.95rem;
	cursor: pointer;
	justify-self: start;

	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`;

const SuccessMessage = styled.p`
	margin: 0;
	font-size: 0.9rem;
`;

const ErrorMessage = styled.p`
	margin: 0;
	font-size: 0.9rem;
`;
