import styled, { css, keyframes } from "styled-components";
import type { CallStatus } from "../../types/runs";

const colorMap: Record<
	CallStatus,
	{ bg: string; fg: string; ring: string; label: string; pulse?: boolean }
> = {
	queued: { bg: "rgba(160,160,181,0.12)", fg: "#c8c8d6", ring: "rgba(160,160,181,0.32)", label: "Queued" },
	ringing: { bg: "rgba(251,191,36,0.14)", fg: "#fbbf24", ring: "rgba(251,191,36,0.4)", label: "Ringing", pulse: true },
	in_progress: { bg: "rgba(96,165,250,0.16)", fg: "#93c5fd", ring: "rgba(96,165,250,0.45)", label: "Live", pulse: true },
	completed: { bg: "rgba(52,211,153,0.14)", fg: "#34d399", ring: "rgba(52,211,153,0.4)", label: "Completed" },
	no_answer: { bg: "rgba(248,113,113,0.12)", fg: "#fca5a5", ring: "rgba(248,113,113,0.35)", label: "No answer" },
	busy: { bg: "rgba(248,113,113,0.12)", fg: "#fca5a5", ring: "rgba(248,113,113,0.35)", label: "Busy" },
	failed: { bg: "rgba(248,113,113,0.16)", fg: "#fca5a5", ring: "rgba(248,113,113,0.45)", label: "Failed" },
	canceled: { bg: "rgba(160,160,181,0.12)", fg: "#a0a0b5", ring: "rgba(160,160,181,0.32)", label: "Canceled" },
};

export default function RunStatusBadge({ status }: { status: CallStatus }) {
	const c = colorMap[status];
	return (
		<Badge $bg={c.bg} $fg={c.fg} $ring={c.ring}>
			<Dot $fg={c.fg} $pulse={!!c.pulse} />
			{c.label}
		</Badge>
	);
}

const pulse = keyframes`
	0%, 100% { opacity: 1; transform: scale(1); }
	50% { opacity: 0.45; transform: scale(0.85); }
`;

const Badge = styled.span<{ $bg: string; $fg: string; $ring: string }>`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 4px 10px;
	border-radius: 999px;
	background: ${(p) => p.$bg};
	color: ${(p) => p.$fg};
	font-size: 0.78rem;
	font-weight: 500;
	border: 1px solid ${(p) => p.$ring};
`;

const Dot = styled.span<{ $fg: string; $pulse: boolean }>`
	width: 6px;
	height: 6px;
	border-radius: 50%;
	background: ${(p) => p.$fg};
	${(p) =>
		p.$pulse &&
		css`
			animation: ${pulse} 1.4s ease-in-out infinite;
		`}
`;
