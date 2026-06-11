import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import styled from "styled-components";
import RunStatusBadge from "../runs/RunStatusBadge";
import { useTestRuns } from "../../hooks/useRun";
import type { Run } from "../../types/runs";
import type { Test } from "../../types/suite";

const scoreColor = (n: number) =>
	n >= 70 ? "var(--success)" : n >= 40 ? "var(--warning)" : "var(--danger)";

const formatTimestamp = (iso: string): string => {
	const d = new Date(iso);
	const now = Date.now();
	const diffSec = Math.round((now - d.getTime()) / 1000);
	if (diffSec < 60) return `${diffSec}s ago`;
	if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
	if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
	return d.toLocaleString();
};

const formatDuration = (sec: number | null): string => {
	if (sec === null) return "—";
	if (sec < 60) return `${sec}s`;
	const m = Math.floor(sec / 60);
	const s = sec % 60;
	return `${m}m ${s.toString().padStart(2, "0")}s`;
};

export default function TestHistoryDialog({
	test,
	open,
	onClose,
}: {
	test: Test;
	open: boolean;
	onClose: () => void;
}) {
	const { data, isLoading, error } = useTestRuns(test.id, open);

	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open, onClose]);

	if (!open) return null;

	// Render via portal to document.body so the modal escapes any ancestor
	// that's an animation/transform containing block (e.g. the TestCard's
	// fadeInUp animation, which would otherwise clip `position: fixed`).
	return createPortal(
		<Backdrop onClick={onClose}>
			<Modal onClick={(e) => e.stopPropagation()}>
				<Header>
					<div>
						<EyebrowLabel>Run history</EyebrowLabel>
						<Title>{test.name}</Title>
					</div>
					<CloseBtn type="button" onClick={onClose} aria-label="Close">×</CloseBtn>
				</Header>

				{isLoading && <Status>Loading…</Status>}
				{error && <Status $danger>{(error as Error).message}</Status>}
				{data && data.length === 0 && (
					<Status>No runs yet for this test.</Status>
				)}
				{data && data.length > 0 && (
					<List>
						{data.map((run) => (
							<Row key={run.id} run={run} onClose={onClose} />
						))}
					</List>
				)}
			</Modal>
		</Backdrop>,
		document.body,
	);
}

function Row({ run, onClose }: { run: Run; onClose: () => void }) {
	return (
		<RowLink to={`/runs/${run.id}`} onClick={onClose}>
			<Left>
				<TopLine>
					<TimeStr>{formatTimestamp(run.createdAt)}</TimeStr>
					{run.attemptNumber > 1 && (
						<AttemptChip>retry · attempt {run.attemptNumber}</AttemptChip>
					)}
				</TopLine>
				<TargetTag $kind={run.targetKind}>
					{run.targetKind === "user_bot" ? "User bot" : run.targetLabel}
				</TargetTag>
			</Left>
			<Mid>
				<RunStatusBadge status={run.status} />
				<Duration>{formatDuration(run.durationSeconds)}</Duration>
			</Mid>
			<Right>
				{run.overallScore !== null ? (
					<Score $color={scoreColor(run.overallScore)}>{run.overallScore}%</Score>
				) : (
					<Score $color="var(--text-dim)">—</Score>
				)}
				<Arrow>→</Arrow>
			</Right>
		</RowLink>
	);
}

const Backdrop = styled.div`
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.65);
	backdrop-filter: blur(6px);
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 48px 24px;
	z-index: 55;
	overflow-y: auto;
	animation: fadeIn 0.18s var(--ease-out);
`;

const Modal = styled.div`
	background: var(--bg-elev);
	border: 1px solid var(--border);
	border-radius: var(--radius);
	padding: 28px 32px;
	width: 100%;
	max-width: 1040px;
	max-height: calc(100vh - 96px);
	display: flex;
	flex-direction: column;
	gap: 18px;
	animation: fadeInUp 0.25s var(--ease-out);
	box-shadow: 0 24px 60px -12px rgba(0, 0, 0, 0.6);
`;

const Header = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 16px;
	padding-bottom: 14px;
	border-bottom: 1px solid var(--border);
`;

const EyebrowLabel = styled.div`
	font-size: 0.7rem;
	text-transform: uppercase;
	letter-spacing: 0.18em;
	color: var(--text-dim);
	margin-bottom: 4px;
`;

const Title = styled.h3`
	margin: 0;
	font-size: 1.4rem;
	font-weight: 600;
	letter-spacing: -0.025em;
`;

const CloseBtn = styled.button`
	background: none;
	border: none;
	font-size: 1.4rem;
	color: var(--text-muted);
	cursor: pointer;
	&:hover { color: var(--text); }
`;

const Status = styled.p<{ $danger?: boolean }>`
	margin: 0;
	padding: 32px 0;
	text-align: center;
	color: ${(p) => (p.$danger ? "var(--danger)" : "var(--text-dim)")};
	font-style: italic;
`;

const List = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
	flex: 1;
	min-height: 0;
	overflow-y: auto;
	padding-right: 4px;
`;

const RowLink = styled(Link)`
	display: grid;
	grid-template-columns: minmax(180px, 1.2fr) minmax(180px, 1fr) auto;
	align-items: center;
	gap: 16px;
	padding: 12px 14px;
	background: var(--surface);
	border: 1px solid var(--border);
	border-radius: 10px;
	color: inherit;
	text-decoration: none;
	transition: border-color 0.15s, background 0.15s, transform 0.15s var(--ease-out);
	&:hover {
		border-color: var(--accent);
		background: var(--surface-2);
		transform: translateY(-1px);
	}
`;

const Left = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
	min-width: 0;
`;

const TopLine = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	flex-wrap: wrap;
`;

const TimeStr = styled.span`
	font-size: 0.85rem;
	color: var(--text);
`;

const AttemptChip = styled.span`
	font-size: 0.7rem;
	font-weight: 500;
	color: var(--warning);
	background: rgba(251, 191, 36, 0.10);
	border: 1px solid rgba(251, 191, 36, 0.28);
	padding: 1px 8px;
	border-radius: 999px;
	letter-spacing: 0.02em;
`;

const TargetTag = styled.span<{ $kind: Run["targetKind"] }>`
	font-size: 0.72rem;
	font-weight: 500;
	color: ${(p) => (p.$kind === "user_bot" ? "var(--accent-bright)" : "var(--warning)")};
	background: ${(p) =>
		p.$kind === "user_bot"
			? "rgba(139, 92, 246, 0.10)"
			: "rgba(251, 191, 36, 0.10)"};
	border: 1px solid ${(p) =>
		p.$kind === "user_bot"
			? "rgba(139, 92, 246, 0.28)"
			: "rgba(251, 191, 36, 0.28)"};
	padding: 1px 8px;
	border-radius: 999px;
	width: max-content;
`;

const Mid = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
`;

const Duration = styled.span`
	font-family: var(--font-mono);
	font-size: 0.78rem;
	color: var(--text-dim);
`;

const Right = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
`;

const Score = styled.span<{ $color: string }>`
	font-family: var(--font-mono);
	font-size: 0.95rem;
	font-weight: 600;
	color: ${(p) => p.$color};
	min-width: 3ch;
	text-align: right;
`;

const Arrow = styled.span`
	color: var(--text-dim);
	font-size: 0.9rem;
	transition: transform 0.15s var(--ease-out), color 0.15s;
	${RowLink}:hover & {
		color: var(--accent-bright);
		transform: translateX(3px);
	}
`;
