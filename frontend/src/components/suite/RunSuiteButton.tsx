import styled from "styled-components";
import { useStartSuiteRun } from "../../hooks/useSuite";

export default function RunSuiteButton({ agentId }: { agentId: string }) {
	const start = useStartSuiteRun(agentId);
	return (
		<Wrap>
			<Button onClick={() => start.mutate({})} disabled={start.isPending}>
				{start.isPending ? "Starting…" : "▶ Run whole suite"}
			</Button>
			{start.error && <ErrorText>{(start.error as Error).message}</ErrorText>}
		</Wrap>
	);
}

const Wrap = styled.div`
	display: inline-flex;
	flex-direction: column;
	gap: 6px;
`;

const Button = styled.button`
	background: linear-gradient(180deg, var(--accent-bright), var(--accent));
	color: white;
	border: none;
	border-radius: 999px;
	padding: 10px 20px;
	font-size: 0.9rem;
	font-weight: 500;
	cursor: pointer;
	box-shadow: 0 8px 22px -8px var(--accent-glow), 0 0 0 1px rgba(167, 139, 250, 0.35);
	transition: transform 0.15s var(--ease-out), box-shadow 0.18s var(--ease-out);
	&:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 12px 30px -8px var(--accent-glow), 0 0 0 1px rgba(167, 139, 250, 0.6);
	}
	&:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const ErrorText = styled.p`
	color: var(--danger);
	margin: 0;
	font-size: 0.85rem;
`;
