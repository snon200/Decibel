import { Link } from "react-router-dom";
import styled from "styled-components";
import { useAgentsList } from "../../hooks/useAgents";

export default function AgentList() {
	const { data, isLoading, error } = useAgentsList();

	if (isLoading) return <Empty>Loading agents…</Empty>;
	if (error) return <ErrorText>{(error as Error).message}</ErrorText>;
	if (!data || data.length === 0) return <Empty>No agents yet.</Empty>;

	return (
		<List>
			{data.map((agent, i) => (
				<Card key={agent.id} to={`/agents/${agent.id}`} style={{ animationDelay: `${i * 40}ms` }}>
					<CardHeader>
						<Name>{agent.name}</Name>
						<Phone>{agent.phoneNumber}</Phone>
					</CardHeader>
					<Description>{agent.description}</Description>
					<Footer>
						<Hint>Created {new Date(agent.createdAt).toLocaleDateString()}</Hint>
						<Open>Open →</Open>
					</Footer>
				</Card>
			))}
		</List>
	);
}

const List = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
	gap: 16px;
`;

const Card = styled(Link)`
	background: var(--surface);
	border: 1px solid var(--border);
	border-radius: var(--radius);
	padding: 20px;
	text-decoration: none;
	color: inherit;
	display: flex;
	flex-direction: column;
	gap: 10px;
	transition: border-color 0.2s var(--ease-out), transform 0.2s var(--ease-out), background 0.2s var(--ease-out);
	animation: fadeInUp 0.4s var(--ease-out) both;

	&:hover {
		border-color: var(--accent);
		transform: translateY(-2px);
		background: var(--surface-2);
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
	font-weight: 600;
	letter-spacing: -0.015em;
	color: var(--text);
`;

const Phone = styled.span`
	font-family: var(--font-mono);
	font-size: 0.78rem;
	color: var(--text-dim);
`;

const Description = styled.p`
	margin: 0;
	font-size: 0.92rem;
	line-height: 1.5;
	color: var(--text-muted);
	display: -webkit-box;
	-webkit-line-clamp: 3;
	-webkit-box-orient: vertical;
	overflow: hidden;
`;

const Footer = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	border-top: 1px solid var(--border);
	padding-top: 10px;
	margin-top: auto;
`;

const Hint = styled.span`
	font-size: 0.78rem;
	color: var(--text-dim);
`;

const Open = styled.span`
	font-size: 0.85rem;
	color: var(--accent-bright);
	transition: transform 0.15s var(--ease-out);
	${Card}:hover & { transform: translateX(3px); }
`;

const Empty = styled.p`
	color: var(--text-muted);
	font-style: italic;
`;

const ErrorText = styled.p`
	color: var(--danger);
`;
