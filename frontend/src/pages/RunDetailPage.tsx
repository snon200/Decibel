import { Link, useParams } from "react-router-dom";
import styled from "styled-components";
import { useRun } from "../hooks/useRun";
import RunStatusBadge from "../components/runs/RunStatusBadge";
import TargetSummary from "../components/runs/TargetSummary";
import TranscriptViewer from "../components/runs/TranscriptViewer";
import AudioPlayer from "../components/runs/AudioPlayer";
import Scorecard from "../components/scorecard/Scorecard";
import { isTerminal } from "../types/runs";

export default function RunDetailPage() {
	const { runId } = useParams();
	const { data, isLoading, error } = useRun(runId);

	if (isLoading) return <Status>Loading run…</Status>;
	if (error) return <Status $danger>{(error as Error).message}</Status>;
	if (!data) return <Status>Run not found.</Status>;

	const { run, test, scores, audioUrl } = data;
	const live = !isTerminal(run.status);

	return (
		<Wrap>
			<TopRow>
				<BackLink to={`/agents/${test.agentId}`}>← Back to agent</BackLink>
				<RunStatusBadge status={run.status} />
			</TopRow>

			<Header>
				<TestName>{test.name}</TestName>
				<TargetSummary run={run} />
			</Header>

			{live && (
				<LiveBanner>
					<Pulse />
					Call in progress — transcript and scorecard update automatically.
				</LiveBanner>
			)}

			{run.error && <ErrorText>{run.error}</ErrorText>}

			<Section>
				<SectionTitle>Recording</SectionTitle>
				<AudioPlayer url={audioUrl} />
			</Section>

			<Section>
				<SectionTitle>Transcript</SectionTitle>
				<TranscriptViewer transcript={run.transcript} />
			</Section>

			<Section>
				<SectionTitle>Scorecard</SectionTitle>
				<Scorecard
					criteria={test.criteria}
					scores={scores}
					overallScore={run.overallScore}
				/>
			</Section>
		</Wrap>
	);
}

const Wrap = styled.div`
	padding: 32px;
	max-width: 1000px;
	margin: 0 auto;
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: 24px;
	animation: fadeIn 0.3s var(--ease-out);
`;

const TopRow = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
`;

const BackLink = styled(Link)`
	color: var(--text-muted);
	text-decoration: none;
	font-size: 0.9rem;
	transition: color 0.15s;
	&:hover {
		color: var(--accent-bright);
	}
`;

const Header = styled.header`
	display: flex;
	flex-direction: column;
	gap: 10px;
`;

const TestName = styled.h1`
	margin: 0;
	font-size: 1.7rem;
	font-weight: 600;
	letter-spacing: -0.025em;
`;

const LiveBanner = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
	background: rgba(96, 165, 250, 0.10);
	color: var(--info);
	border: 1px solid rgba(96, 165, 250, 0.3);
	border-radius: var(--radius);
	padding: 10px 14px;
	font-size: 0.9rem;
`;

const Pulse = styled.span`
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background: var(--info);
	box-shadow: 0 0 12px var(--info);
	animation: glowPulse 1.6s ease-in-out infinite;
`;

const Section = styled.section`
	display: flex;
	flex-direction: column;
	gap: 10px;
`;

const SectionTitle = styled.h2`
	margin: 0;
	font-size: 0.92rem;
	font-weight: 500;
	color: var(--text-muted);
	letter-spacing: 0.06em;
	text-transform: uppercase;
`;

const ErrorText = styled.p`
	color: var(--danger);
	margin: 0;
`;

const Status = styled.p<{ $danger?: boolean }>`
	padding: 60px 32px;
	text-align: center;
	color: ${(p) => (p.$danger ? "var(--danger)" : "var(--text-muted)")};
`;
