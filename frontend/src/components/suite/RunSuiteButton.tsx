import { useEffect, useState } from "react";
import styled from "styled-components";
import { useStartSuiteRun } from "../../hooks/useSuite";

export default function RunSuiteButton({
	agentId,
	testCount,
}: {
	agentId: string;
	testCount: number;
}) {
	const start = useStartSuiteRun(agentId);
	const [flash, setFlash] = useState<string | null>(null);

	useEffect(() => {
		if (!flash) return;
		const t = setTimeout(() => setFlash(null), 4500);
		return () => clearTimeout(t);
	}, [flash]);

	const click = () => {
		if (testCount === 0) return;
		start.mutate(
			{},
			{
				onSuccess: (runs) => {
					setFlash(
						runs.length === 1
							? "Dialing 1 test now…"
							: `Dialing ${runs.length} tests now…`,
					);
				},
			},
		);
	};

	const disabled = start.isPending || testCount === 0;
	const tooltip =
		testCount === 0
			? "Generate a suite first — there are no tests to run yet."
			: undefined;

	return (
		<Wrap>
			<Button onClick={click} disabled={disabled} title={tooltip}>
				{start.isPending ? "Starting…" : "▶ Run test suite"}
			</Button>
			{testCount === 0 && !start.isPending && (
				<Hint>No tests yet — generate a suite first.</Hint>
			)}
			{flash && <Flash key={flash}>{flash}</Flash>}
			{start.error && <ErrorText>{(start.error as Error).message}</ErrorText>}
		</Wrap>
	);
}

const Wrap = styled.div`
	display: inline-flex;
	flex-direction: column;
	gap: 6px;
	max-width: 280px;
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

const Hint = styled.span`
	color: var(--text-dim);
	font-size: 0.8rem;
`;

const Flash = styled.span`
	color: var(--success);
	font-size: 0.85rem;
	animation: fadeInUp 0.3s var(--ease-out);
`;

const ErrorText = styled.span`
	color: var(--danger);
	font-size: 0.85rem;
`;
