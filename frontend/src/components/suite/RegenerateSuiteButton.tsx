import styled from "styled-components";
import { useRegenerateSuite } from "../../hooks/useSuite";

export default function RegenerateSuiteButton({ agentId }: { agentId: string }) {
	const regen = useRegenerateSuite(agentId);
	return (
		<Wrap>
			<Button
				onClick={() => {
					if (window.confirm("Replace the current suite with a freshly generated one?")) {
						regen.mutate();
					}
				}}
				disabled={regen.isPending}
			>
				{regen.isPending ? "Regenerating…" : "↻ Regenerate suite"}
			</Button>
			{regen.error && <ErrorText>{(regen.error as Error).message}</ErrorText>}
		</Wrap>
	);
}

const Wrap = styled.div`
	display: inline-flex;
	flex-direction: column;
	gap: 6px;
`;

const Button = styled.button`
	background: transparent;
	color: var(--text-muted);
	border: 1px solid var(--border);
	border-radius: 999px;
	padding: 10px 20px;
	font-size: 0.9rem;
	cursor: pointer;
	transition: color 0.15s, border-color 0.15s;
	&:hover:not(:disabled) {
		color: var(--text);
		border-color: var(--border-strong);
	}
	&:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const ErrorText = styled.p`
	color: var(--danger);
	margin: 0;
	font-size: 0.85rem;
`;
