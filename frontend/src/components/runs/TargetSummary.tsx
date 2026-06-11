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
	display: flex;
	align-items: center;
	gap: 12px;
	color: #4b5563;
	font-size: 0.9rem;
`;

const Chip = styled.span`
	background: #eef2ff;
	color: #3730a3;
	padding: 2px 8px;
	border-radius: 4px;
	font-weight: 500;
	font-size: 0.8rem;
`;

const Label = styled.span`
	font-weight: 500;
`;

const Phone = styled.span`
	font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
	color: #6b7280;
`;
