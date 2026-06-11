import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { useAddTests } from "../../hooks/useSuite";

const DEFAULT_COUNT = 3;
const MIN_COUNT = 1;
const MAX_COUNT = 8;

export default function AddTestsButton({ agentId }: { agentId: string }) {
	const add = useAddTests(agentId);
	const [open, setOpen] = useState(false);
	const [focus, setFocus] = useState("");
	const [count, setCount] = useState(DEFAULT_COUNT);
	const [flash, setFlash] = useState<string | null>(null);
	const focusRef = useRef<HTMLTextAreaElement | null>(null);

	useEffect(() => {
		if (open) focusRef.current?.focus();
	}, [open]);

	useEffect(() => {
		if (!flash) return;
		const t = setTimeout(() => setFlash(null), 4500);
		return () => clearTimeout(t);
	}, [flash]);

	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape" && !add.isPending) close();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, add.isPending]);

	const close = () => {
		setOpen(false);
		setFocus("");
		setCount(DEFAULT_COUNT);
		add.reset();
	};

	const submit = (e: React.FormEvent) => {
		e.preventDefault();
		const body: { focus?: string; count?: number } = { count };
		const trimmed = focus.trim();
		if (trimmed) body.focus = trimmed;
		add.mutate(body, {
			onSuccess: (rows) => {
				setFlash(
					rows.length === 1 ? "Added 1 test." : `Added ${rows.length} tests.`,
				);
				close();
			},
		});
	};

	return (
		<>
			<Wrap>
				<Button type="button" onClick={() => setOpen(true)} disabled={add.isPending}>
					+ Add more tests
				</Button>
				{flash && <Flash>{flash}</Flash>}
			</Wrap>

			{open && (
				<Backdrop onClick={() => !add.isPending && close()}>
					<Modal
						onClick={(e) => e.stopPropagation()}
						onSubmit={submit}
						role="dialog"
						aria-modal="true"
					>
						<Title>Add tests to suite</Title>
						<Body>
							Tell the model what the new tests should focus on, or leave the
							field blank to let it pick gaps in your existing coverage.
						</Body>

						<Field>
							<Label htmlFor="add-tests-focus">Focus (optional)</Label>
							<Textarea
								id="add-tests-focus"
								ref={focusRef}
								value={focus}
								onChange={(e) => setFocus(e.target.value)}
								placeholder="e.g. cancellation flows, rude callers, ambiguous date requests"
								rows={3}
								maxLength={500}
								disabled={add.isPending}
							/>
						</Field>

						<Field>
							<Label htmlFor="add-tests-count">
								How many tests? ({MIN_COUNT}–{MAX_COUNT})
							</Label>
							<NumberInput
								id="add-tests-count"
								type="number"
								min={MIN_COUNT}
								max={MAX_COUNT}
								value={count}
								onChange={(e) => {
									const n = Number(e.target.value);
									if (Number.isFinite(n)) {
										setCount(Math.max(MIN_COUNT, Math.min(MAX_COUNT, Math.round(n))));
									}
								}}
								disabled={add.isPending}
							/>
						</Field>

						{add.error && <ErrorText>{(add.error as Error).message}</ErrorText>}

						<Footer>
							<CancelBtn type="button" onClick={close} disabled={add.isPending}>
								Cancel
							</CancelBtn>
							<SubmitBtn type="submit" disabled={add.isPending}>
								{add.isPending ? "Generating…" : `Generate ${count} test${count === 1 ? "" : "s"}`}
							</SubmitBtn>
						</Footer>
					</Modal>
				</Backdrop>
			)}
		</>
	);
}

const Wrap = styled.div`
	display: inline-flex;
	flex-direction: column;
	gap: 6px;
`;

const Button = styled.button`
	background: transparent;
	color: var(--text-muted);
	border: 1px solid var(--border);
	border-radius: 999px;
	padding: 10px 20px;
	font-size: 0.9rem;
	cursor: pointer;
	transition: color 0.15s, border-color 0.15s;
	&:hover:not(:disabled) {
		color: var(--text);
		border-color: var(--border-strong);
	}
	&:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const Flash = styled.span`
	color: var(--success);
	font-size: 0.82rem;
	animation: fadeInUp 0.3s var(--ease-out);
`;

const Backdrop = styled.div`
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.65);
	backdrop-filter: blur(6px);
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 24px;
	z-index: 60;
	animation: fadeIn 0.18s var(--ease-out);
`;

const Modal = styled.form`
	background: var(--bg-elev);
	border: 1px solid var(--border);
	border-radius: var(--radius);
	padding: 24px;
	width: 100%;
	max-width: 520px;
	display: flex;
	flex-direction: column;
	gap: 14px;
	animation: fadeInUp 0.25s var(--ease-out);
	box-shadow: 0 24px 60px -12px rgba(0, 0, 0, 0.6);
`;

const Title = styled.h3`
	margin: 0;
	font-size: 1.1rem;
	font-weight: 600;
	letter-spacing: -0.02em;
`;

const Body = styled.p`
	margin: 0;
	color: var(--text-muted);
	line-height: 1.55;
	font-size: 0.92rem;
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

const Textarea = styled.textarea`
	background: var(--surface);
	color: var(--text);
	border: 1px solid var(--border);
	border-radius: 8px;
	padding: 10px 12px;
	font-family: inherit;
	font-size: 0.95rem;
	line-height: 1.5;
	resize: vertical;
	min-height: 72px;
	&:focus {
		outline: none;
		border-color: var(--accent);
		box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.18);
	}
`;

const NumberInput = styled.input`
	background: var(--surface);
	color: var(--text);
	border: 1px solid var(--border);
	border-radius: 8px;
	padding: 8px 12px;
	font-family: var(--font-mono);
	font-size: 0.95rem;
	width: 100px;
	&:focus {
		outline: none;
		border-color: var(--accent);
		box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.18);
	}
`;

const Footer = styled.div`
	display: flex;
	gap: 8px;
	justify-content: flex-end;
	margin-top: 4px;
`;

const CancelBtn = styled.button`
	background: transparent;
	color: var(--text-muted);
	border: 1px solid var(--border);
	border-radius: 999px;
	padding: 8px 16px;
	font-size: 0.9rem;
	cursor: pointer;
	&:hover:not(:disabled) {
		color: var(--text);
		border-color: var(--border-strong);
	}
	&:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const SubmitBtn = styled.button`
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

const ErrorText = styled.p`
	color: var(--danger);
	margin: 0;
	font-size: 0.85rem;
`;
