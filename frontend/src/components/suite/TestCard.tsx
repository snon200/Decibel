import { useState } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import RunStatusBadge from "../runs/RunStatusBadge";
import TestHistoryDialog from "./TestHistoryDialog";
import { useStartTestRun } from "../../hooks/useSuite";
import { isTerminal, type Run } from "../../types/runs";
import type { Test } from "../../types/suite";

const scoreColor = (n: number) =>
	n >= 70 ? "var(--success)" : n >= 40 ? "var(--warning)" : "var(--danger)";

export default function TestCard({
	test,
	latestRun,
	agentId,
	onEdit,
}: {
	test: Test;
	latestRun: Run | null;
	agentId: string;
	onEdit: () => void;
}) {
	const start = useStartTestRun(agentId);
	const [historyOpen, setHistoryOpen] = useState(false);
	const busy = start.isPending || (latestRun != null && !isTerminal(latestRun.status));

	return (
		<Card>
			<Header>
				<Name>{test.name}</Name>
				{latestRun && <RunStatusBadge status={latestRun.status} />}
			</Header>
			<Summary>{test.scenarioSummary}</Summary>
			<Meta>
				<MetaChip>{test.criteria.length} criteria</MetaChip>
				{latestRun?.overallScore != null && (
					<ScoreChip $color={scoreColor(latestRun.overallScore)}>
						{latestRun.overallScore}%
					</ScoreChip>
				)}
			</Meta>
			<Actions>
				<RunBtn onClick={() => start.mutate({ testId: test.id })} disabled={busy}>
					{busy ? "Running…" : "Run"}
				</RunBtn>
				<EditBtn onClick={onEdit}>Edit</EditBtn>
				<HistoryBtn type="button" onClick={() => setHistoryOpen(true)}>
					History
				</HistoryBtn>
				{latestRun && (busy || isTerminal(latestRun.status)) && (
					<ResultsLink to={`/runs/${latestRun.id}`}>View results →</ResultsLink>
				)}
			</Actions>
			{start.error && <ErrorText>{(start.error as Error).message}</ErrorText>}
			<TestHistoryDialog
				test={test}
				open={historyOpen}
				onClose={() => setHistoryOpen(false)}
			/>
		</Card>
	);
}

const Card = styled.div`
	background: var(--surface);
	border: 1px solid var(--border);
	border-radius: var(--radius);
	padding: 18px;
	display: flex;
	flex-direction: column;
	gap: 10px;
	transition: border-color 0.2s var(--ease-out);
	animation: fadeInUp 0.4s var(--ease-out) both;
	&:hover {
		border-color: var(--border-strong);
	}
`;

const Header = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 12px;
`;

const Name = styled.h3`
	margin: 0;
	font-size: 1rem;
	font-weight: 600;
	letter-spacing: -0.015em;
	color: var(--text);
`;

const Summary = styled.p`
	margin: 0;
	font-size: 0.9rem;
	color: var(--text-muted);
	line-height: 1.5;
`;

const Meta = styled.div`
	display: flex;
	gap: 8px;
`;

const MetaChip = styled.span`
	background: var(--surface-2);
	color: var(--text-muted);
	border: 1px solid var(--border);
	padding: 2px 8px;
	border-radius: 4px;
	font-size: 0.72rem;
`;

const ScoreChip = styled.span<{ $color: string }>`
	background: var(--surface-2);
	color: ${(p) => p.$color};
	border: 1px solid var(--border);
	padding: 2px 8px;
	border-radius: 4px;
	font-size: 0.72rem;
	font-weight: 600;
`;

const Actions = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	margin-top: 4px;
	flex-wrap: wrap;
`;

const RunBtn = styled.button`
	background: linear-gradient(180deg, var(--accent-bright), var(--accent));
	color: white;
	border: none;
	border-radius: 999px;
	padding: 6px 16px;
	font-size: 0.82rem;
	font-weight: 500;
	cursor: pointer;
	transition: transform 0.15s var(--ease-out), box-shadow 0.18s var(--ease-out);
	box-shadow: 0 4px 12px -4px var(--accent-glow);
	&:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 6px 18px -4px var(--accent-glow);
	}
	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const ghostBtn = `
	background: transparent;
	color: var(--text-muted);
	border: 1px solid var(--border);
	border-radius: 999px;
	padding: 6px 14px;
	font-size: 0.82rem;
	cursor: pointer;
	transition: color 0.15s, border-color 0.15s;
	&:hover {
		color: var(--text);
		border-color: var(--border-strong);
	}
`;

const EditBtn = styled.button`${ghostBtn}`;
const HistoryBtn = styled.button`${ghostBtn}`;

const ResultsLink = styled(Link)`
	color: var(--accent-bright);
	font-size: 0.82rem;
	text-decoration: none;
	margin-left: auto;
	&:hover {
		text-decoration: underline;
	}
`;

const ErrorText = styled.p`
	color: var(--danger);
	font-size: 0.82rem;
	margin: 0;
`;
