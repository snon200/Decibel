import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { useUpdateAgent } from "../../hooks/useAgents";
import { E164_REGEX, normalizePhone } from "../../utils/phone";

export default function EditableAgentPhone({
	agentId,
	phoneNumber,
}: {
	agentId: string;
	phoneNumber: string;
}) {
	const update = useUpdateAgent(agentId);
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState(phoneNumber);
	const [localError, setLocalError] = useState<string | null>(null);
	const inputRef = useRef<HTMLInputElement | null>(null);

	useEffect(() => {
		if (!editing) setDraft(phoneNumber);
	}, [phoneNumber, editing]);

	useEffect(() => {
		if (editing) inputRef.current?.select();
	}, [editing]);

	const commit = () => {
		const normalized = normalizePhone(draft);
		if (!E164_REGEX.test(normalized)) {
			setLocalError("Phone must be E.164 (e.g. +14155551234).");
			return;
		}
		if (normalized === phoneNumber) {
			setEditing(false);
			setLocalError(null);
			return;
		}
		setLocalError(null);
		update.mutate(
			{ phoneNumber: normalized },
			{ onSuccess: () => setEditing(false) },
		);
	};

	const cancel = () => {
		setDraft(phoneNumber);
		setLocalError(null);
		setEditing(false);
	};

	if (!editing) {
		return (
			<Wrap>
				<Phone>{phoneNumber}</Phone>
				<EditBtn type="button" onClick={() => setEditing(true)} aria-label="Edit phone">
					Edit
				</EditBtn>
			</Wrap>
		);
	}

	const errorText = localError ?? (update.error as Error | null)?.message;

	return (
		<Wrap>
			<PhoneInput
				ref={inputRef}
				type="tel"
				value={draft}
				onChange={(e) => setDraft(normalizePhone(e.target.value))}
				onKeyDown={(e) => {
					if (e.key === "Enter") commit();
					if (e.key === "Escape") cancel();
				}}
				maxLength={20}
				autoFocus
				disabled={update.isPending}
				autoComplete="off"
				spellCheck={false}
			/>
			<SaveBtn type="button" onClick={commit} disabled={update.isPending}>
				{update.isPending ? "Saving…" : "Save"}
			</SaveBtn>
			<CancelBtn type="button" onClick={cancel} disabled={update.isPending}>
				Cancel
			</CancelBtn>
			{errorText && <ErrorText>{errorText}</ErrorText>}
		</Wrap>
	);
}

const Wrap = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	flex-wrap: wrap;
`;

const Phone = styled.span`
	font-family: var(--font-mono);
	color: var(--text-dim);
	font-size: 0.88rem;
`;

const PhoneInput = styled.input`
	background: var(--surface);
	color: var(--text);
	border: 1px solid var(--accent);
	border-radius: 6px;
	padding: 4px 10px;
	font-family: var(--font-mono);
	font-size: 0.88rem;
	min-width: 220px;
	&:focus {
		outline: none;
		box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.18);
	}
`;

const ghostBtn = `
	background: transparent;
	border-radius: 999px;
	padding: 3px 10px;
	font-size: 0.75rem;
	cursor: pointer;
	transition: color 0.15s, border-color 0.15s;
`;

const EditBtn = styled.button`
	${ghostBtn}
	color: var(--text-dim);
	border: 1px solid transparent;
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
	padding: 4px 12px;
	font-size: 0.78rem;
	font-weight: 500;
	cursor: pointer;
	box-shadow: 0 4px 12px -4px var(--accent-glow);
	&:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const CancelBtn = styled.button`
	${ghostBtn}
	color: var(--text-muted);
	border: 1px solid var(--border);
	&:hover:not(:disabled) {
		color: var(--text);
		border-color: var(--border-strong);
	}
	&:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const ErrorText = styled.span`
	color: var(--danger);
	font-size: 0.8rem;
	width: 100%;
`;
