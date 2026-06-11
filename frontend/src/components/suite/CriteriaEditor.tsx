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
	const remove = (i: number) => {
		const next = criteria.filter((_, idx) => idx !== i);
		onChange(next);
	};
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
	grid-template-columns: 180px 1fr 32px;
	gap: 8px;
	align-items: center;
`;

const SlugInput = styled.input`
	padding: 6px 8px;
	border: 1px solid #d1d5db;
	border-radius: 4px;
	font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
	font-size: 0.8rem;
`;

const TextInput = styled.input`
	padding: 6px 8px;
	border: 1px solid #d1d5db;
	border-radius: 4px;
	font-size: 0.9rem;
`;

const RemoveBtn = styled.button`
	background: white;
	border: 1px solid #d1d5db;
	border-radius: 4px;
	width: 32px;
	height: 32px;
	cursor: pointer;
	font-size: 1.1rem;
	color: #991b1b;
	&:hover {
		background: #fecaca;
	}
`;

const AddBtn = styled.button`
	align-self: flex-start;
	background: white;
	border: 1px dashed #9ca3af;
	border-radius: 4px;
	padding: 6px 12px;
	font-size: 0.85rem;
	cursor: pointer;
	&:hover {
		background: #f9fafb;
	}
`;
