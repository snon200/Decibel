import { Link } from "react-router-dom";
import styled from "styled-components";
import { useAgentsList } from "../../hooks/useAgents";

export default function AgentList() {
	const { data, isLoading, error } = useAgentsList();

	if (isLoading) return <Empty>Loading agents…</Empty>;
	if (error) return <ErrorText>{(error as Error).message}</ErrorText>;
	if (!data || data.length === 0)
		return <Empty>No agents yet. Register one above.</Empty>;

	return (
		<List>
			{data.map((agent) => (
				<Card key={agent.id} to={`/agents/${agent.id}`}>
					<CardHeader>
						<Name>{agent.name}</Name>
						<Phone>{agent.phoneNumber}</Phone>
					</CardHeader>
					<Description>{agent.description}</Description>
				</Card>
			))}
		</List>
	);
}

const List = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
	gap: 16px;
`;

const Card = styled(Link)`
	background: white;
	border: 1px solid #e5e7eb;
	border-radius: 8px;
	padding: 16px;
	text-decoration: none;
	color: inherit;
	display: flex;
	flex-direction: column;
	gap: 8px;
	transition: border-color 0.15s;
	&:hover {
		border-color: #2563eb;
	}
`;

const CardHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: baseline;
	gap: 12px;
`;

const Name = styled.h3`
	margin: 0;
	font-size: 1.05rem;
`;

const Phone = styled.span`
	font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
	font-size: 0.8rem;
	color: #6b7280;
`;

const Description = styled.p`
	margin: 0;
	font-size: 0.9rem;
	color: #4b5563;
	display: -webkit-box;
	-webkit-line-clamp: 3;
	-webkit-box-orient: vertical;
	overflow: hidden;
`;

const Empty = styled.p`
	color: #6b7280;
	font-style: italic;
`;

const ErrorText = styled.p`
	color: #c0392b;
`;
