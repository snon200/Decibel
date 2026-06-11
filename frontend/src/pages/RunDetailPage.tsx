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

	if (isLoading) return <p>Loading run…</p>;
	if (error) return <ErrorText>{(error as Error).message}</ErrorText>;
	if (!data) return <p>Run not found.</p>;

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
	display: flex;
	flex-direction: column;
	gap: 24px;
`;

const TopRow = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
`;

const BackLink = styled(Link)`
	color: #2563eb;
	text-decoration: none;
	font-size: 0.9rem;
	&:hover {
		text-decoration: underline;
	}
`;

const Header = styled.header`
	display: flex;
	flex-direction: column;
	gap: 8px;
`;

const TestName = styled.h1`
	margin: 0;
	font-size: 1.5rem;
`;

const LiveBanner = styled.div`
	background: #dbeafe;
	color: #1e40af;
	border-radius: 6px;
	padding: 8px 12px;
	font-size: 0.9rem;
`;

const Section = styled.section`
	display: flex;
	flex-direction: column;
	gap: 8px;
`;

const SectionTitle = styled.h2`
	margin: 0;
	font-size: 1rem;
	color: #374151;
`;

const ErrorText = styled.p`
	color: #c0392b;
	margin: 0;
`;
