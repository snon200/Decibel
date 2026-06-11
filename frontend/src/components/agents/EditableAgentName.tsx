import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { useUpdateAgent } from "../../hooks/useAgents";

export default function EditableAgentName({
	agentId,
	name,
}: {
	agentId: string;
	name: string;
}) {
	const update = useUpdateAgent(agentId);
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState(name);
	const inputRef = useRef<HTMLInputElement | null>(null);

	useEffect(() => {
		if (!editing) setDraft(name);
	}, [name, editing]);

	useEffect(() => {
		if (editing) inputRef.current?.select();
	}, [editing]);

	const commit = () => {
		const next = draft.trim();
		if (!next || next === name) {
			setDraft(name);
			setEditing(false);
			return;
		}
		update.mutate(
			{ name: next },
			{
				onSuccess: () => setEditing(false),
				onError: () => {
					// keep edit mode open so the user can retry/cancel
				},
			},
		);
	};

	const cancel = () => {
		setDraft(name);
		setEditing(false);
	};

	if (!editing) {
		return (
			<Wrap>
				<Name>{name}</Name>
				<EditBtn type="button" onClick={() => setEditing(true)} aria-label="Rename">
					Rename
				</EditBtn>
			</Wrap>
		);
	}

	return (
		<Wrap>
			<NameInput
				ref={inputRef}
				value={draft}
				onChange={(e) => setDraft(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === "Enter") commit();
					if (e.key === "Escape") cancel();
				}}
				maxLength={120}
				autoFocus
				disabled={update.isPending}
			/>
			<SaveBtn type="button" onClick={commit} disabled={update.isPending}>
				{update.isPending ? "Saving…" : "Save"}
			</SaveBtn>
			<CancelBtn type="button" onClick={cancel} disabled={update.isPending}>
				Cancel
			</CancelBtn>
			{update.error && (
				<ErrorText>{(update.error as Error).message}</ErrorText>
			)}
		</Wrap>
	);
}

const Wrap = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 10px;
	flex-wrap: wrap;
`;

const Name = styled.h1`
	margin: 0;
	font-size: 1.8rem;
	font-weight: 600;
	letter-spacing: -0.025em;
	color: var(--text);
`;

const NameInput = styled.input`
	background: var(--surface);
	color: var(--text);
	border: 1px solid var(--accent);
	border-radius: 8px;
	padding: 6px 12px;
	font-size: 1.6rem;
	font-weight: 600;
	font-family: inherit;
	letter-spacing: -0.025em;
	min-width: 280px;
	&:focus {
		outline: none;
		box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.18);
	}
`;

const EditBtn = styled.button`
	background: transparent;
	color: var(--text-dim);
	border: 1px solid transparent;
	border-radius: 999px;
	padding: 4px 10px;
	font-size: 0.78rem;
	cursor: pointer;
	transition: color 0.15s, border-color 0.15s;
	&:hover {
		color: var(--text);
		border-color: var(--border);
	}
`;

const SaveBtn = styled.button`
	background: linear-gradient(180deg, var(--accent-bright), var(--accent));
	color: white;
	border: none;
	border-radius: 999px;
	padding: 6px 14px;
	font-size: 0.82rem;
	font-weight: 500;
	cursor: pointer;
	box-shadow: 0 4px 12px -4px var(--accent-glow);
	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
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
	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const ErrorText = styled.span`
	color: var(--danger);
	font-size: 0.85rem;
	width: 100%;
`;
