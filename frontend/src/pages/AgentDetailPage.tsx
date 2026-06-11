import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import styled from "styled-components";
import { agentKey, useAgent } from "../hooks/useAgents";
import SuiteList from "../components/suite/SuiteList";
import RunSuiteButton from "../components/suite/RunSuiteButton";
import RegenerateSuiteButton from "../components/suite/RegenerateSuiteButton";
import { isTerminal } from "../types/runs";

export default function AgentDetailPage() {
	const { agentId } = useParams();
	const { data, isLoading, error } = useAgent(agentId);
	const qc = useQueryClient();

	// Poll the agent detail while any run is non-terminal so per-test rows
	// reflect live status without needing per-card useRun hooks.
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

	if (isLoading) return <p>Loading…</p>;
	if (error) return <ErrorText>{(error as Error).message}</ErrorText>;
	if (!data) return <p>Agent not found.</p>;

	const { agent, tests, latestRunsByTest } = data;

	return (
		<Wrap>
			<Header>
				<HeaderLeft>
					<AgentName>{agent.name}</AgentName>
					<Phone>{agent.phoneNumber}</Phone>
				</HeaderLeft>
				<Actions>
					<RunSuiteButton agentId={agent.id} />
					<RegenerateSuiteButton agentId={agent.id} />
				</Actions>
			</Header>

			<Description>{agent.description}</Description>

			<SectionTitle>Test suite ({tests.length})</SectionTitle>
			<SuiteList
				tests={tests}
				latestRunsByTest={latestRunsByTest}
				agentId={agent.id}
			/>
		</Wrap>
	);
}

const Wrap = styled.div`
	display: flex;
	flex-direction: column;
	gap: 24px;
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
	gap: 4px;
`;

const AgentName = styled.h1`
	margin: 0;
	font-size: 1.5rem;
`;

const Phone = styled.span`
	font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
	color: #6b7280;
	font-size: 0.9rem;
`;

const Actions = styled.div`
	display: flex;
	gap: 8px;
	align-items: flex-start;
`;

const Description = styled.p`
	margin: 0;
	color: #374151;
	background: #f9fafb;
	border-left: 3px solid #e5e7eb;
	padding: 12px 16px;
	border-radius: 0 6px 6px 0;
`;

const SectionTitle = styled.h2`
	margin: 0;
	font-size: 1.1rem;
`;

const ErrorText = styled.p`
	color: #c0392b;
`;
