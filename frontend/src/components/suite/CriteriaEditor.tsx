import styled from "styled-components";
import {
	CRITERION_KIND_HINTS,
	CRITERION_KIND_LABELS,
	type Criterion,
	type CriterionKind,
} from "../../types/suite";

const KINDS: CriterionKind[] = ["transcript", "received_sms", "sms_content"];

/**
 * received_sms has no per-criterion text input (the kind itself defines the
 * expectation), but the backend still requires non-empty text. We stamp this
 * canonical sentence so the row is shaped correctly without bothering the user.
 */
const RECEIVED_SMS_PLACEHOLDER_TEXT =
	"Bot sends an SMS to the tester during or after the call.";

export default function CriteriaEditor({
	criteria,
	onChange,
}: {
	criteria: Criterion[];
	onChange: (next: Criterion[]) => void;
}) {
	const update = (i: number, patch: Partial<Criterion>) => {
		const next = [...criteria];
		const current = next[i];
		if (!current) return;
		const merged = { ...current, ...patch };

		// Switching INTO received_sms — stamp canonical text if the field was
		// empty (or still the placeholder), so the user sees nothing relevant
		// got dropped and the row passes validation.
		if (
			patch.kind === "received_sms" &&
			(!current.text.trim() || current.text === RECEIVED_SMS_PLACEHOLDER_TEXT)
		) {
			merged.text = RECEIVED_SMS_PLACEHOLDER_TEXT;
		}

		// Switching AWAY from received_sms when the text is still the canonical
		// stamp — clear it so the user can type a real description.
		if (
			patch.kind &&
			patch.kind !== "received_sms" &&
			current.text === RECEIVED_SMS_PLACEHOLDER_TEXT
		) {
			merged.text = "";
		}

		next[i] = merged;
		onChange(next);
	};
	const remove = (i: number) => onChange(criteria.filter((_, idx) => idx !== i));
	const add = () => {
		const slug = `criterion-${criteria.length + 1}`;
		onChange([...criteria, { id: slug, text: "", kind: "transcript" }]);
	};

	return (
		<Wrap>
			{criteria.map((c, i) => {
				const kind = c.kind ?? "transcript";
				const isReceivedSms = kind === "received_sms";
				return (
					<RowBlock key={i}>
						<Row>
							<SlugInput
								value={c.id}
								onChange={(e) => update(i, { id: e.target.value })}
								placeholder="kebab-case-slug"
							/>
							{isReceivedSms ? (
								<TextStandin>
									No description needed — pass = SMS received.
								</TextStandin>
							) : (
								<TextInput
									value={c.text}
									onChange={(e) => update(i, { text: e.target.value })}
									placeholder={
										kind === "sms_content"
											? "What should the SMS contain?"
											: "What does the bot need to do?"
									}
								/>
							)}
							<KindSelect
								value={kind}
								onChange={(e) =>
									update(i, { kind: e.target.value as CriterionKind })
								}
							>
								{KINDS.map((k) => (
									<option key={k} value={k}>
										{CRITERION_KIND_LABELS[k]}
									</option>
								))}
							</KindSelect>
							<RemoveBtn
								type="button"
								onClick={() => remove(i)}
								aria-label="Remove"
							>
								×
							</RemoveBtn>
						</Row>
						<Hint>{CRITERION_KIND_HINTS[kind]}</Hint>
					</RowBlock>
				);
			})}
			<AddBtn type="button" onClick={add}>+ Add criterion</AddBtn>
		</Wrap>
	);
}

const Wrap = styled.div`
	display: flex;
	flex-direction: column;
	gap: 12px;
`;

const RowBlock = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
`;

const Row = styled.div`
	display: grid;
	grid-template-columns: 180px 1fr 150px 32px;
	gap: 8px;
	align-items: center;
`;

const fieldStyle = `
	padding: 8px 10px;
	background: var(--bg-elev);
	color: var(--text);
	border: 1px solid var(--border);
	border-radius: 6px;
	transition: border-color 0.15s;
	&:focus {
		outline: none;
		border-color: var(--accent);
	}
`;

const SlugInput = styled.input`
	${fieldStyle}
	font-family: var(--font-mono);
	font-size: 0.8rem;
`;

const TextInput = styled.input`
	${fieldStyle}
	font-size: 0.9rem;
`;

const TextStandin = styled.div`
	padding: 8px 10px;
	border: 1px dashed var(--border);
	border-radius: 6px;
	font-size: 0.85rem;
	color: var(--text-dim);
	font-style: italic;
`;

const KindSelect = styled.select`
	${fieldStyle}
	font-size: 0.85rem;
	cursor: pointer;
`;

const Hint = styled.span`
	font-size: 0.72rem;
	color: var(--text-dim);
	padding-left: 192px;
`;

const RemoveBtn = styled.button`
	background: transparent;
	border: 1px solid var(--border);
	border-radius: 6px;
	width: 32px;
	height: 32px;
	cursor: pointer;
	font-size: 1.1rem;
	color: var(--danger);
	&:hover {
		background: rgba(248, 113, 113, 0.12);
		border-color: var(--danger);
	}
`;

const AddBtn = styled.button`
	align-self: flex-start;
	background: transparent;
	color: var(--text-muted);
	border: 1px dashed var(--border-strong);
	border-radius: 6px;
	padding: 6px 12px;
	font-size: 0.85rem;
	cursor: pointer;
	&:hover {
		color: var(--text);
		border-color: var(--accent);
	}
`;
