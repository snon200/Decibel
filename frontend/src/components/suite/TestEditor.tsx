import { useState } from "react";
import styled from "styled-components";
import CriteriaEditor from "./CriteriaEditor";
import { useUpdateTest } from "../../hooks/useSuite";
import type { Criterion, Test } from "../../types/suite";

export default function TestEditor({
	test,
	agentId,
	onClose,
}: {
	test: Test;
	agentId: string;
	onClose: () => void;
}) {
	const update = useUpdateTest(agentId);
	const [name, setName] = useState(test.name);
	const [scenarioSummary, setScenarioSummary] = useState(test.scenarioSummary);
	const [testerInstruction, setTesterInstruction] = useState(test.testerInstruction);
	const [criteria, setCriteria] = useState<Criterion[]>(test.criteria);

	const submit = (e: React.FormEvent) => {
		e.preventDefault();
		update.mutate(
			{ id: test.id, patch: { name, scenarioSummary, testerInstruction, criteria } },
			{ onSuccess: onClose },
		);
	};

	return (
		<Backdrop onClick={onClose}>
			<Modal onClick={(e) => e.stopPropagation()} onSubmit={submit}>
				<Header>
					<Title>Edit test</Title>
					<CloseBtn type="button" onClick={onClose} aria-label="Close">×</CloseBtn>
				</Header>

				<Field>
					<Label>Name</Label>
					<Input value={name} onChange={(e) => setName(e.target.value)} />
				</Field>

				<Field>
					<Label>Scenario summary</Label>
					<Textarea
						rows={2}
						value={scenarioSummary}
						onChange={(e) => setScenarioSummary(e.target.value)}
					/>
				</Field>

				<Field>
					<Label>Tester instruction (outbound system prompt)</Label>
					<Textarea
						rows={8}
						value={testerInstruction}
						onChange={(e) => setTesterInstruction(e.target.value)}
					/>
				</Field>

				<Field>
					<Label>Criteria</Label>
					<CriteriaEditor criteria={criteria} onChange={setCriteria} />
				</Field>

				{update.error && <ErrorText>{(update.error as Error).message}</ErrorText>}

				<Footer>
					<Cancel type="button" onClick={onClose}>Cancel</Cancel>
					<Save type="submit" disabled={update.isPending}>
						{update.isPending ? "Saving…" : "Save"}
					</Save>
				</Footer>
			</Modal>
		</Backdrop>
	);
}

const Backdrop = styled.div`
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.65);
	backdrop-filter: blur(6px);
	display: flex;
	align-items: flex-start;
	justify-content: center;
	padding: 64px 24px 24px;
	z-index: 50;
	overflow-y: auto;
	animation: fadeIn 0.2s var(--ease-out);
`;

const Modal = styled.form`
	background: var(--bg-elev);
	border: 1px solid var(--border);
	border-radius: var(--radius);
	padding: 24px;
	width: 100%;
	max-width: 720px;
	display: flex;
	flex-direction: column;
	gap: 16px;
	animation: fadeInUp 0.3s var(--ease-out);
`;

const Header = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
`;

const Title = styled.h2`
	margin: 0;
	font-size: 1.15rem;
	font-weight: 600;
	letter-spacing: -0.02em;
`;

const CloseBtn = styled.button`
	background: none;
	border: none;
	font-size: 1.4rem;
	color: var(--text-muted);
	cursor: pointer;
	&:hover { color: var(--text); }
`;

const Field = styled.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
`;

const Label = styled.label`
	font-size: 0.82rem;
	font-weight: 500;
	color: var(--text-muted);
`;

const inputCss = `
	background: var(--surface);
	color: var(--text);
	border: 1px solid var(--border);
	border-radius: 8px;
	padding: 10px 12px;
	font-size: 0.95rem;
	font-family: inherit;
	transition: border-color 0.15s;
	&:focus { outline: none; border-color: var(--accent); }
`;

const Input = styled.input`${inputCss}`;
const Textarea = styled.textarea`${inputCss} resize: vertical;`;

const Footer = styled.div`
	display: flex;
	gap: 8px;
	justify-content: flex-end;
`;

const Save = styled.button`
	background: linear-gradient(180deg, var(--accent-bright), var(--accent));
	color: white;
	border: none;
	border-radius: 999px;
	padding: 8px 18px;
	font-size: 0.9rem;
	font-weight: 500;
	cursor: pointer;
	box-shadow: 0 4px 12px -4px var(--accent-glow);
	&:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const Cancel = styled.button`
	background: transparent;
	color: var(--text-muted);
	border: 1px solid var(--border);
	border-radius: 999px;
	padding: 8px 18px;
	cursor: pointer;
	&:hover { color: var(--text); border-color: var(--border-strong); }
`;

const ErrorText = styled.p`
	color: var(--danger);
	margin: 0;
	font-size: 0.9rem;
`;
