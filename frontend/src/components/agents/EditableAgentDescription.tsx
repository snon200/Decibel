import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { useUpdateAgent } from "../../hooks/useAgents";

const MIN_LEN = 10;
const MAX_LEN = 2000;

export default function EditableAgentDescription({
	agentId,
	description,
}: {
	agentId: string;
	description: string;
}) {
	const update = useUpdateAgent(agentId);
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState(description);
	const [localError, setLocalError] = useState<string | null>(null);
	const textareaRef = useRef<HTMLTextAreaElement | null>(null);

	useEffect(() => {
		if (!editing) setDraft(description);
	}, [description, editing]);

	useEffect(() => {
		if (editing) textareaRef.current?.focus();
	}, [editing]);

	const commit = () => {
		const next = draft.trim();
		if (next.length < MIN_LEN) {
			setLocalError("Description should be at least a sentence.");
			return;
		}
		if (next.length > MAX_LEN) {
			setLocalError(`Description must be ${MAX_LEN} characters or fewer.`);
			return;
		}
		if (next === description) {
			setEditing(false);
			setLocalError(null);
			return;
		}
		setLocalError(null);
		update.mutate(
			{ description: next },
			{ onSuccess: () => setEditing(false) },
		);
	};

	const cancel = () => {
		setDraft(description);
		setLocalError(null);
		setEditing(false);
	};

	if (!editing) {
		return (
			<Card>
				<Text>{description}</Text>
				<EditBtn type="button" onClick={() => setEditing(true)} aria-label="Edit description">
					Edit
				</EditBtn>
			</Card>
		);
	}

	const errorText = localError ?? (update.error as Error | null)?.message;

	return (
		<EditingCard>
			<Textarea
				ref={textareaRef}
				value={draft}
				onChange={(e) => setDraft(e.target.value)}
				rows={Math.max(4, Math.min(12, draft.split("\n").length + 1))}
				maxLength={MAX_LEN}
				disabled={update.isPending}
			/>
			<Footer>
				<Counter $over={draft.length > MAX_LEN}>
					{draft.length} / {MAX_LEN}
				</Counter>
				<Spacer />
				<CancelBtn type="button" onClick={cancel} disabled={update.isPending}>
					Cancel
				</CancelBtn>
				<SaveBtn type="button" onClick={commit} disabled={update.isPending}>
					{update.isPending ? "Saving…" : "Save"}
				</SaveBtn>
			</Footer>
			{errorText && <ErrorText>{errorText}</ErrorText>}
		</EditingCard>
	);
}

const cardBase = `
	background: var(--surface);
	border: 1px solid var(--border);
	border-left: 3px solid var(--accent);
	border-radius: 0 var(--radius) var(--radius) 0;
	padding: 14px 18px;
`;

const Card = styled.div`
	${cardBase}
	display: flex;
	gap: 16px;
	align-items: flex-start;
	transition: border-color 0.15s;
	&:hover {
		border-color: var(--border-strong);
		border-left-color: var(--accent);
	}
`;

const Text = styled.p`
	margin: 0;
	color: var(--text-muted);
	line-height: 1.6;
	flex: 1;
`;

const EditBtn = styled.button`
	background: transparent;
	color: var(--text-dim);
	border: 1px solid transparent;
	border-radius: 999px;
	padding: 4px 12px;
	font-size: 0.78rem;
	cursor: pointer;
	transition: color 0.15s, border-color 0.15s;
	flex-shrink: 0;
	&:hover {
		color: var(--text);
		border-color: var(--border);
	}
`;

const EditingCard = styled.div`
	${cardBase}
	display: flex;
	flex-direction: column;
	gap: 10px;
`;

const Textarea = styled.textarea`
	background: var(--bg-elev);
	color: var(--text);
	border: 1px solid var(--accent);
	border-radius: 8px;
	padding: 10px 12px;
	font-family: inherit;
	font-size: 0.95rem;
	line-height: 1.55;
	resize: vertical;
	min-height: 100px;
	&:focus {
		outline: none;
		box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.18);
	}
`;

const Footer = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
`;

const Counter = styled.span<{ $over: boolean }>`
	font-size: 0.78rem;
	color: ${(p) => (p.$over ? "var(--danger)" : "var(--text-dim)")};
	font-family: var(--font-mono);
`;

const Spacer = styled.div`
	flex: 1;
`;

const CancelBtn = styled.button`
	background: transparent;
	color: var(--text-muted);
	border: 1px solid var(--border);
	border-radius: 999px;
	padding: 6px 14px;
	font-size: 0.82rem;
	cursor: pointer;
	&:hover:not(:disabled) {
		color: var(--text);
		border-color: var(--border-strong);
	}
	&:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const SaveBtn = styled.button`
	background: linear-gradient(180deg, var(--accent-bright), var(--accent));
	color: white;
	border: none;
	border-radius: 999px;
	padding: 6px 16px;
	font-size: 0.82rem;
	font-weight: 500;
	cursor: pointer;
	box-shadow: 0 4px 12px -4px var(--accent-glow);
	&:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const ErrorText = styled.p`
	color: var(--danger);
	font-size: 0.85rem;
	margin: 0;
`;
