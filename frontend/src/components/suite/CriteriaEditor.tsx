import styled from "styled-components";
import type { Criterion } from "../../types/suite";

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
		next[i] = { ...current, ...patch };
		onChange(next);
	};
	const remove = (i: number) => onChange(criteria.filter((_, idx) => idx !== i));
	const add = () => {
		const slug = `criterion-${criteria.length + 1}`;
		onChange([...criteria, { id: slug, text: "" }]);
	};

	return (
		<Wrap>
			{criteria.map((c, i) => (
				<Row key={i}>
					<SlugInput
						value={c.id}
						onChange={(e) => update(i, { id: e.target.value })}
						placeholder="kebab-case-slug"
					/>
					<TextInput
						value={c.text}
						onChange={(e) => update(i, { text: e.target.value })}
						placeholder="What does the bot need to do?"
					/>
					<RemoveBtn type="button" onClick={() => remove(i)} aria-label="Remove">
						×
					</RemoveBtn>
				</Row>
			))}
			<AddBtn type="button" onClick={add}>+ Add criterion</AddBtn>
		</Wrap>
	);
}

const Wrap = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
`;

const Row = styled.div`
	display: grid;
	grid-template-columns: 200px 1fr 32px;
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
