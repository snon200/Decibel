import { useQuery } from "@tanstack/react-query";
import styled from "styled-components";
import { fetchAccountIds } from "../api";

export const ACCOUNT_IDS_QUERY_KEY = ["account-ids"];

type AccountListProps = {
	onSelectAccount: (accountId: string) => void;
};

export default function AccountList({ onSelectAccount }: AccountListProps) {
	const { data: accountIds, isLoading } = useQuery({
		queryKey: ACCOUNT_IDS_QUERY_KEY,
		queryFn: fetchAccountIds,
	});

	if (isLoading) return <Subtle>Loading accounts...</Subtle>;
	if (!accountIds?.length) return null;

	return (
		<Container>
			<Title>Accounts</Title>
			<List>
				{accountIds.map((id) => (
					<Item key={id}>
						<span>{id}</span>
						<UseButton onClick={() => onSelectAccount(id)}>Use ATM</UseButton>
					</Item>
				))}
			</List>
		</Container>
	);
}

const Container = styled.section`
	background: white;
	border: 1px solid rgba(0, 0, 0, 0.2);
	border-radius: 8px;
	padding: 16px;
`;

const Title = styled.h3`
	margin: 0 0 12px 0;
`;

const List = styled.ul`
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: 8px;
`;

const Item = styled.li`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 8px 12px;
	border: 1px solid rgba(0, 0, 0, 0.1);
	border-radius: 6px;
`;

const Subtle = styled.p`
	margin: 0;
	color: rgba(0, 0, 0, 0.6);
`;

const UseButton = styled.button`
	padding: 4px 12px;
	background: rgb(99, 102, 241);
	color: white;
	border: none;
	border-radius: 6px;
	cursor: pointer;

	&:hover {
		background: rgb(79, 70, 229);
	}
`;
