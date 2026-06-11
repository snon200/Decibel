import styled from "styled-components";
import type { CallStatus } from "../../types/runs";

const colorMap: Record<CallStatus, { bg: string; fg: string; label: string }> = {
	queued: { bg: "#e5e7eb", fg: "#374151", label: "Queued" },
	ringing: { bg: "#fef3c7", fg: "#92400e", label: "Ringing" },
	in_progress: { bg: "#dbeafe", fg: "#1e40af", label: "Live" },
	completed: { bg: "#d1fae5", fg: "#065f46", label: "Completed" },
	no_answer: { bg: "#fed7aa", fg: "#9a3412", label: "No answer" },
	busy: { bg: "#fed7aa", fg: "#9a3412", label: "Busy" },
	failed: { bg: "#fecaca", fg: "#991b1b", label: "Failed" },
	canceled: { bg: "#e5e7eb", fg: "#374151", label: "Canceled" },
};

export default function RunStatusBadge({ status }: { status: CallStatus }) {
	const c = colorMap[status];
	return <Badge $bg={c.bg} $fg={c.fg}>{c.label}</Badge>;
}

const Badge = styled.span<{ $bg: string; $fg: string }>`
	display: inline-block;
	padding: 2px 10px;
	border-radius: 999px;
	background: ${(p) => p.$bg};
	color: ${(p) => p.$fg};
	font-size: 0.8rem;
	font-weight: 500;
`;
