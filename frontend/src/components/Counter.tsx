import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import styled from "styled-components";
import { apiGet, apiPost } from "../api";
import type { Counter } from "../types";

const counterKey = ["counter"] as const;

export default function Counter() {
	const queryClient = useQueryClient();

	const { data, isLoading, error } = useQuery({
		queryKey: counterKey,
		queryFn: () => apiGet<Counter>("/counter"),
	});

	const mutate = (path: "/counter/increment" | "/counter/decrement") =>
		apiPost<Counter>(path);

	const increment = useMutation({
		mutationFn: () => mutate("/counter/increment"),
		onSuccess: (row) => queryClient.setQueryData(counterKey, row),
	});

	const decrement = useMutation({
		mutationFn: () => mutate("/counter/decrement"),
		onSuccess: (row) => queryClient.setQueryData(counterKey, row),
	});

	const busy = increment.isPending || decrement.isPending;

	return (
		<Card>
			<Title>Counter</Title>
			{error && <ErrorText>{(error as Error).message}</ErrorText>}
			<Row>
				<Button
					type="button"
					onClick={() => decrement.mutate()}
					disabled={busy || isLoading}
					aria-label="decrement"
				>
					−
				</Button>
				<Value aria-live="polite">{isLoading ? "…" : data?.value ?? 0}</Value>
				<Button
					type="button"
					onClick={() => increment.mutate()}
					disabled={busy || isLoading}
					aria-label="increment"
				>
					+
				</Button>
			</Row>
		</Card>
	);
}

const Card = styled.section`
	background: white;
	border: 1px solid #e2e6ee;
	border-radius: 12px;
	padding: 24px;
	display: flex;
	flex-direction: column;
	gap: 16px;
	align-items: center;
`;

const Title = styled.h2`
	margin: 0;
	font-size: 1.1rem;
`;

const Row = styled.div`
	display: flex;
	align-items: center;
	gap: 24px;
`;

const Value = styled.div`
	font-size: 2.4rem;
	font-variant-numeric: tabular-nums;
	min-width: 4ch;
	text-align: center;
`;

const Button = styled.button`
	width: 48px;
	height: 48px;
	font-size: 1.4rem;
	border-radius: 8px;
	border: 1px solid #cdd3df;
	background: #f6f8fb;
	cursor: pointer;

	&:hover:not(:disabled) {
		background: #eef1f6;
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const ErrorText = styled.p`
	color: #c0392b;
	margin: 0;
`;
