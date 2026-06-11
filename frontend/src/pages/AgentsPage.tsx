import { useState } from "react";
import styled from "styled-components";
import WelcomeWizard from "../components/agents/WelcomeWizard";
import AgentList from "../components/agents/AgentList";
import { useAgentsList } from "../hooks/useAgents";

export default function AgentsPage() {
	const { data, isLoading } = useAgentsList();
	const [forceWizard, setForceWizard] = useState(false);

	const noAgents = !isLoading && (!data || data.length === 0);

	if (noAgents || forceWizard) {
		return (
			<>
				<WelcomeWizard />
				{!noAgents && (
					<FloatingClose onClick={() => setForceWizard(false)}>
						← Back to agents
					</FloatingClose>
				)}
			</>
		);
	}

	return (
		<ListShell>
			<Header>
				<HeaderTitle>Your agents</HeaderTitle>
				<NewBtn type="button" onClick={() => setForceWizard(true)}>
					+ New agent
				</NewBtn>
			</Header>
			<AgentList />
		</ListShell>
	);
}

const ListShell = styled.section`
	padding: 40px 32px 64px;
	max-width: 1200px;
	margin: 0 auto;
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: 24px;
	animation: fadeIn 0.35s var(--ease-out);
`;

const Header = styled.header`
	display: flex;
	justify-content: space-between;
	align-items: baseline;
	gap: 16px;
`;

const HeaderTitle = styled.h1`
	margin: 0;
	font-size: 1.6rem;
	font-weight: 600;
	letter-spacing: -0.025em;
`;

const NewBtn = styled.button`
	background: linear-gradient(180deg, var(--accent-bright), var(--accent));
	color: white;
	border: none;
	border-radius: 999px;
	padding: 10px 18px;
	font-size: 0.9rem;
	font-weight: 500;
	cursor: pointer;
	box-shadow: 0 6px 18px -6px var(--accent-glow), 0 0 0 1px rgba(167, 139, 250, 0.35);
	transition: transform 0.15s var(--ease-out);
	&:hover {
		transform: translateY(-1px);
	}
`;

const FloatingClose = styled.button`
	position: fixed;
	top: 16px;
	left: 16px;
	z-index: 20;
	background: rgba(8, 8, 12, 0.7);
	color: var(--text-muted);
	border: 1px solid var(--border);
	border-radius: 999px;
	padding: 8px 14px;
	font-size: 0.85rem;
	cursor: pointer;
	backdrop-filter: blur(8px);
	&:hover {
		color: var(--text);
		border-color: var(--border-strong);
	}
`;
