import styled from "styled-components";
import { useRegenerateSuite } from "../../hooks/useSuite";

export default function RegenerateSuiteButton({ agentId }: { agentId: string }) {
	const regen = useRegenerateSuite(agentId);
	return (
		<>
			<Button
				onClick={() => {
					if (
						window.confirm(
							"Replace the current suite with a freshly generated one?",
						)
					) {
						regen.mutate();
					}
				}}
				disabled={regen.isPending}
			>
				{regen.isPending ? "Regenerating…" : "Regenerate suite"}
			</Button>
			{regen.error && <ErrorText>{(regen.error as Error).message}</ErrorText>}
		</>
	);
}

const Button = styled.button`
	background: white;
	color: #374151;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	padding: 8px 16px;
	font-size: 0.95rem;
	cursor: pointer;
	&:hover:not(:disabled) {
		background: #f9fafb;
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
