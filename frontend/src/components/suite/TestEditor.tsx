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
			{
				id: test.id,
				patch: { name, scenarioSummary, testerInstruction, criteria },
			},
			{ onSuccess: onClose },
		);
	};

	return (
		<Backdrop onClick={onClose}>
			<Modal onClick={(e) => e.stopPropagation()} onSubmit={submit}>
				<Header>
					<Title>Edit test</Title>
					<CloseBtn type="button" onClick={onClose} aria-label="Close">
						×
					</CloseBtn>
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

				{update.error && (
					<ErrorText>{(update.error as Error).message}</ErrorText>
				)}

				<Footer>
					<Save type="submit" disabled={update.isPending}>
						{update.isPending ? "Saving…" : "Save"}
					</Save>
					<Cancel type="button" onClick={onClose}>
						Cancel
					</Cancel>
				</Footer>
			</Modal>
		</Backdrop>
	);
}

const Backdrop = styled.div`
	position: fixed;
	inset: 0;
	background: rgba(15, 23, 42, 0.5);
	display: flex;
	align-items: flex-start;
	justify-content: center;
	padding: 64px 24px 24px;
	z-index: 50;
	overflow-y: auto;
`;

const Modal = styled.form`
	background: white;
	border-radius: 8px;
	padding: 24px;
	width: 100%;
	max-width: 720px;
	display: flex;
	flex-direction: column;
	gap: 16px;
`;

const Header = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
`;

const Title = styled.h2`
	margin: 0;
	font-size: 1.2rem;
`;

const CloseBtn = styled.button`
	background: none;
	border: none;
	font-size: 1.4rem;
	color: #6b7280;
	cursor: pointer;
	&:hover {
		color: #1f2937;
	}
`;

const Field = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
`;

const Label = styled.label`
	font-size: 0.85rem;
	font-weight: 500;
	color: #374151;
`;

const Input = styled.input`
	padding: 8px 10px;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	font-size: 0.95rem;
`;

const Textarea = styled.textarea`
	padding: 8px 10px;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	font-size: 0.9rem;
	font-family: inherit;
	resize: vertical;
`;

const Footer = styled.div`
	display: flex;
	gap: 8px;
	justify-content: flex-end;
`;

const Save = styled.button`
	background: #2563eb;
	color: white;
	border: none;
	border-radius: 6px;
	padding: 8px 16px;
	cursor: pointer;
	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`;

const Cancel = styled.button`
	background: white;
	color: #374151;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	padding: 8px 16px;
	cursor: pointer;
`;

const ErrorText = styled.p`
	color: #c0392b;
	margin: 0;
`;
