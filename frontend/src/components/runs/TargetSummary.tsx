import styled from "styled-components";
import type { Run } from "../../types/runs";

export default function TargetSummary({ run }: { run: Run }) {
	const kindLabel = run.targetKind === "user_bot" ? "User bot" : "Competitor";
	return (
		<Wrap>
			<Chip>{kindLabel}</Chip>
			<Label>{run.targetLabel}</Label>
			<Phone>{run.targetPhoneNumber}</Phone>
		</Wrap>
	);
}

const Wrap = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 10px;
	color: var(--text-muted);
	font-size: 0.85rem;
`;

const Chip = styled.span`
	background: rgba(139, 92, 246, 0.14);
	color: var(--accent-bright);
	border: 1px solid rgba(139, 92, 246, 0.32);
	padding: 2px 8px;
	border-radius: 999px;
	font-weight: 500;
	font-size: 0.72rem;
	letter-spacing: 0.02em;
`;

const Label = styled.span`
	color: var(--text);
	font-weight: 500;
`;

const Phone = styled.span`
	font-family: var(--font-mono);
	color: var(--text-dim);
`;
