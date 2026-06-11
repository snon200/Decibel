import { Link, useParams } from "react-router-dom";
import styled from "styled-components";
import { useCancelRun, useRun } from "../hooks/useRun";
import RunStatusBadge from "../components/runs/RunStatusBadge";
import TargetSummary from "../components/runs/TargetSummary";
import TranscriptViewer from "../components/runs/TranscriptViewer";
import AudioPlayer from "../components/runs/AudioPlayer";
import ConversationPlayer from "../components/runs/ConversationPlayer";
import Scorecard from "../components/scorecard/Scorecard";
import { isCancellable, isTerminal } from "../types/runs";

export default function RunDetailPage() {
	const { runId } = useParams();
	const { data, isLoading, error } = useRun(runId);
	// useCancelRun needs an agentId for cache invalidation. Hook into the
	// agent the run belongs to (resolved from the test once data loads).
	const cancel = useCancelRun(data?.test.agentId ?? "");

	if (isLoading) return <Status>Loading run…</Status>;
	if (error) return <Status $danger>{(error as Error).message}</Status>;
	if (!data) return <Status>Run not found.</Status>;

	const { run, test, scores, audioUrl } = data;
	const live = !isTerminal(run.status);
	const cancellable = isCancellable(run.status);

	return (
		<Wrap>
			<TopRow>
				<BackLink to={`/agents/${test.agentId}`}>← Back to agent</BackLink>
				<TopRight>
					<RunStatusBadge status={run.status} />
					{cancellable && (
						<CancelBtn
							type="button"
							onClick={() => cancel.mutate(run.id)}
							disabled={cancel.isPending}
						>
							{cancel.isPending ? "Cancelling…" : "Cancel run"}
						</CancelBtn>
					)}
				</TopRight>
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

			{cancel.error && (
				<ErrorText>{(cancel.error as Error).message}</ErrorText>
			)}

			{run.error && <ErrorText>{run.error}</ErrorText>}

			{audioUrl ? (
				<Section>
					<SectionTitle>Recording &amp; transcript</SectionTitle>
					<ConversationPlayer
						url={audioUrl}
						transcript={run.transcript ?? ""}
						durationSeconds={run.durationSeconds}
						messages={run.messages}
					/>
				</Section>
			) : (
				<>
					<Section>
						<SectionTitle>Recording</SectionTitle>
						<AudioPlayer url={audioUrl} />
					</Section>

					<Section>
						<SectionTitle>Transcript</SectionTitle>
						<TranscriptViewer transcript={run.transcript} />
					</Section>
				</>
			)}

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
	gap: 12px;
	flex-wrap: wrap;
`;

const TopRight = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
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

const CancelBtn = styled.button`
	background: transparent;
	color: var(--danger);
	border: 1px solid rgba(248, 113, 113, 0.4);
	border-radius: 999px;
	padding: 6px 14px;
	font-size: 0.85rem;
	cursor: pointer;
	transition: background 0.15s, border-color 0.15s;
	&:hover:not(:disabled) {
		background: rgba(248, 113, 113, 0.12);
		border-color: var(--danger);
	}
	&:disabled { opacity: 0.5; cursor: not-allowed; }
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
