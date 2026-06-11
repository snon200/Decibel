import { Link } from "react-router-dom";
import styled from "styled-components";
import RunStatusBadge from "../runs/RunStatusBadge";
import { useStartTestRun } from "../../hooks/useSuite";
import { isTerminal, type Run } from "../../types/runs";
import type { Test } from "../../types/suite";

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
	const busy = start.isPending || (latestRun != null && !isTerminal(latestRun.status));

	return (
		<Card>
			<Header>
				<Name>{test.name}</Name>
				{latestRun && <RunStatusBadge status={latestRun.status} />}
			</Header>
			<Summary>{test.scenarioSummary}</Summary>
			<Meta>
				<CountChip>{test.criteria.length} criteria</CountChip>
				{latestRun?.overallScore != null && (
					<ScoreChip $score={latestRun.overallScore}>
						{latestRun.overallScore}%
					</ScoreChip>
				)}
			</Meta>
			<Actions>
				<RunButton
					onClick={() => start.mutate({ testId: test.id })}
					disabled={busy}
				>
					{busy ? "Running…" : "Run"}
				</RunButton>
				<EditButton onClick={onEdit}>Edit</EditButton>
				{latestRun && isTerminal(latestRun.status) && (
					<ResultsLink to={`/runs/${latestRun.id}`}>View results →</ResultsLink>
				)}
			</Actions>
			{start.error && <ErrorText>{(start.error as Error).message}</ErrorText>}
		</Card>
	);
}

const Card = styled.div`
	background: white;
	border: 1px solid #e5e7eb;
	border-radius: 8px;
	padding: 16px;
	display: flex;
	flex-direction: column;
	gap: 8px;
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
`;

const Summary = styled.p`
	margin: 0;
	font-size: 0.9rem;
	color: #4b5563;
`;

const Meta = styled.div`
	display: flex;
	gap: 8px;
`;

const CountChip = styled.span`
	background: #f3f4f6;
	color: #4b5563;
	padding: 2px 8px;
	border-radius: 4px;
	font-size: 0.75rem;
`;

const ScoreChip = styled.span<{ $score: number }>`
	background: ${(p) =>
		p.$score >= 70 ? "#d1fae5" : p.$score >= 40 ? "#fed7aa" : "#fecaca"};
	color: ${(p) =>
		p.$score >= 70 ? "#065f46" : p.$score >= 40 ? "#9a3412" : "#991b1b"};
	padding: 2px 8px;
	border-radius: 4px;
	font-size: 0.75rem;
	font-weight: 500;
`;

const Actions = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	margin-top: 4px;
`;

const RunButton = styled.button`
	background: #2563eb;
	color: white;
	border: none;
	border-radius: 6px;
	padding: 6px 14px;
	font-size: 0.85rem;
	cursor: pointer;
	&:hover:not(:disabled) {
		background: #1d4ed8;
	}
	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`;

const EditButton = styled.button`
	background: white;
	color: #374151;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	padding: 6px 14px;
	font-size: 0.85rem;
	cursor: pointer;
	&:hover {
		background: #f9fafb;
	}
`;

const ResultsLink = styled(Link)`
	color: #2563eb;
	font-size: 0.85rem;
	text-decoration: none;
	margin-left: auto;
	&:hover {
		text-decoration: underline;
	}
`;

const ErrorText = styled.p`
	color: #c0392b;
	font-size: 0.85rem;
	margin: 0;
`;
