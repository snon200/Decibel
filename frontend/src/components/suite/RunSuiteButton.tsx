import styled from "styled-components";
import { useStartSuiteRun } from "../../hooks/useSuite";

export default function RunSuiteButton({ agentId }: { agentId: string }) {
	const start = useStartSuiteRun(agentId);
	return (
		<>
			<Button
				onClick={() => start.mutate({})}
				disabled={start.isPending}
			>
				{start.isPending ? "Starting…" : "Run whole suite"}
			</Button>
			{start.error && <ErrorText>{(start.error as Error).message}</ErrorText>}
		</>
	);
}

const Button = styled.button`
	background: #059669;
	color: white;
	border: none;
	border-radius: 6px;
	padding: 8px 16px;
	font-size: 0.95rem;
	font-weight: 500;
	cursor: pointer;
	&:hover:not(:disabled) {
		background: #047857;
	}
	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`;

const ErrorText = styled.p`
	color: #c0392b;
	margin: 4px 0 0 0;
	font-size: 0.85rem;
`;
