import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import styled from "styled-components";
import { agentKey, useAgent } from "../hooks/useAgents";
import SuiteList from "../components/suite/SuiteList";
import RunSuiteButton from "../components/suite/RunSuiteButton";
import RegenerateSuiteButton from "../components/suite/RegenerateSuiteButton";
import EditableAgentName from "../components/agents/EditableAgentName";
import EditableAgentPhone from "../components/agents/EditableAgentPhone";
import EditableAgentDescription from "../components/agents/EditableAgentDescription";
import { isTerminal } from "../types/runs";

export default function AgentDetailPage() {
	const { agentId } = useParams();
	const { data, isLoading, error } = useAgent(agentId);
	const qc = useQueryClient();

	useEffect(() => {
		if (!agentId || !data) return;
		const anyLive = Object.values(data.latestRunsByTest).some(
			(r) => r && !isTerminal(r.status),
		);
		if (!anyLive) return;
		const t = setInterval(() => {
			void qc.invalidateQueries({ queryKey: agentKey(agentId) });
		}, 1500);
		return () => clearInterval(t);
	}, [agentId, data, qc]);

	if (isLoading) return <Status>Loading…</Status>;
	if (error) return <Status $danger>{(error as Error).message}</Status>;
	if (!data) return <Status>Agent not found.</Status>;

	const { agent, tests, latestRunsByTest } = data;

	return (
		<Wrap>
			<Header>
				<HeaderLeft>
					<EditableAgentName agentId={agent.id} name={agent.name} />
					<EditableAgentPhone
						agentId={agent.id}
						phoneNumber={agent.phoneNumber}
					/>
				</HeaderLeft>
				<Actions>
					<RunSuiteButton agentId={agent.id} testCount={tests.length} />
					<RegenerateSuiteButton agentId={agent.id} />
				</Actions>
			</Header>

			<EditableAgentDescription
				agentId={agent.id}
				description={agent.description}
			/>

			<SectionRow>
				<SectionTitle>Test suite</SectionTitle>
				<Count>{tests.length} tests</Count>
			</SectionRow>

			<SuiteList tests={tests} latestRunsByTest={latestRunsByTest} agentId={agent.id} />
		</Wrap>
	);
}

const Wrap = styled.div`
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
	align-items: flex-start;
	gap: 16px;
	flex-wrap: wrap;
`;

const HeaderLeft = styled.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
	align-items: flex-start;
`;

const Actions = styled.div`
	display: flex;
	gap: 8px;
	align-items: flex-start;
`;

const SectionRow = styled.div`
	display: flex;
	align-items: baseline;
	gap: 12px;
	margin-top: 8px;
`;

const SectionTitle = styled.h2`
	margin: 0;
	font-size: 1.1rem;
	font-weight: 600;
	letter-spacing: -0.015em;
`;

const Count = styled.span`
	color: var(--text-dim);
	font-size: 0.85rem;
`;

const Status = styled.p<{ $danger?: boolean }>`
	padding: 60px 32px;
	text-align: center;
	color: ${(p) => (p.$danger ? "var(--danger)" : "var(--text-muted)")};
`;
