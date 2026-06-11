import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled, { css, keyframes } from "styled-components";
import { useCreateAgent } from "../../hooks/useAgents";
import { E164_REGEX, normalizePhone } from "../../utils/phone";

type Step = "landing" | "describe" | "phone" | "submitting";

export default function WelcomeWizard() {
	const navigate = useNavigate();
	const createAgent = useCreateAgent();

	const [step, setStep] = useState<Step>("landing");
	const [description, setDescription] = useState("");
	const [phoneNumber, setPhoneNumber] = useState("+");
	const [showError, setShowError] = useState<string | null>(null);

	const descRef = useRef<HTMLTextAreaElement | null>(null);
	const phoneRef = useRef<HTMLInputElement | null>(null);

	useEffect(() => {
		if (step === "describe") descRef.current?.focus();
		if (step === "phone") phoneRef.current?.focus();
	}, [step]);

	const goDescribe = () => {
		setShowError(null);
		setStep("describe");
	};

	const submitDescribe = (e: React.FormEvent) => {
		e.preventDefault();
		if (description.trim().length < 10) {
			setShowError("Tell us a bit more — at least a sentence.");
			return;
		}
		setShowError(null);
		setStep("phone");
	};

	const submitPhone = (e: React.FormEvent) => {
		e.preventDefault();
		const normalized = normalizePhone(phoneNumber);
		if (!E164_REGEX.test(normalized)) {
			setShowError("Phone must be E.164 — include country code (e.g. +14155551234).");
			return;
		}
		setShowError(null);
		setStep("submitting");
		createAgent.mutate(
			{
				phoneNumber: normalized,
				description: description.trim(),
			},
			{
				onSuccess: ({ agent }) => navigate(`/agents/${agent.id}`),
				onError: (err) => {
					setShowError((err as Error).message);
					setStep("phone");
				},
			},
		);
	};

	return (
		<Stage>
			<Backdrop />
			<Inner>
				{step === "landing" && (
					<StepBlock key="landing">
						<Eyebrow>Agent Arena</Eyebrow>
						<Hero>
							Test your voice agent
							<br />
							<HeroAccent>on a real call.</HeroAccent>
						</Hero>
						<Sub>
							Drop in your bot's phone number. We'll design a test suite,
							place real calls, and grade every conversation.
						</Sub>
						<PrimaryBtn type="button" onClick={goDescribe} $glow>
							Get started <Arrow>→</Arrow>
						</PrimaryBtn>
					</StepBlock>
				)}

				{step === "describe" && (
					<StepBlock key="describe" as="form" onSubmit={submitDescribe}>
						<Counter>1 / 2</Counter>
						<Question>What does your agent do?</Question>
						<Hint>
							One paragraph. Persona, purpose, anything it should always do or
							never do.
						</Hint>
						<BigTextarea
							ref={descRef}
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="e.g. Receptionist for Tony's Pizza. Takes table reservations and to-go orders. Knows the menu and hours. Always confirms name and phone before booking. Never quotes prices that aren't on the menu."
							rows={6}
						/>
						{showError && <ErrorText>{showError}</ErrorText>}
						<Row>
							<GhostBtn type="button" onClick={() => setStep("landing")}>
								← Back
							</GhostBtn>
							<PrimaryBtn type="submit">
								Continue <Arrow>→</Arrow>
							</PrimaryBtn>
						</Row>
					</StepBlock>
				)}

				{step === "phone" && (
					<StepBlock key="phone" as="form" onSubmit={submitPhone}>
						<Counter>2 / 2</Counter>
						<Question>Where can we reach it?</Question>
						<Hint>
							The phone number we'll dial when running tests. Any platform,
							any provider — just E.164 format.
						</Hint>
						<BigInput
							ref={phoneRef}
							type="tel"
							value={phoneNumber}
							onChange={(e) => setPhoneNumber(normalizePhone(e.target.value))}
							placeholder="+14155551234"
							autoComplete="off"
							spellCheck={false}
						/>
						{showError && <ErrorText>{showError}</ErrorText>}
						<Row>
							<GhostBtn type="button" onClick={() => setStep("describe")}>
								← Back
							</GhostBtn>
							<PrimaryBtn type="submit">
								Generate suite <Arrow>→</Arrow>
							</PrimaryBtn>
						</Row>
					</StepBlock>
				)}

				{step === "submitting" && (
					<StepBlock key="submitting">
						<Spinner />
						<Question>Designing your test suite…</Question>
						<Hint>This takes a few seconds.</Hint>
					</StepBlock>
				)}
			</Inner>
		</Stage>
	);
}

// ─── styled ────────────────────────────────────────────────────────────────

const slowDrift = keyframes`
	0%, 100% { transform: translate(0, 0); opacity: 1; }
	50% { transform: translate(-2%, 3%); opacity: 0.85; }
`;

const Stage = styled.section`
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	min-height: calc(100vh - 32px);
	padding: 32px;
	overflow: hidden;
`;

const Backdrop = styled.div`
	position: absolute;
	inset: 0;
	pointer-events: none;
	background:
		radial-gradient(ellipse 60% 50% at 50% 30%, rgba(139, 92, 246, 0.18), transparent 60%),
		radial-gradient(ellipse 50% 40% at 70% 80%, rgba(99, 102, 241, 0.10), transparent 60%);
	animation: ${slowDrift} 18s ease-in-out infinite;
`;

const Inner = styled.div`
	position: relative;
	z-index: 1;
	width: 100%;
	max-width: 720px;
	display: flex;
	flex-direction: column;
	align-items: center;
`;

const stepEnter = css`
	animation: fadeInUp 0.5s var(--ease-out);
`;

const StepBlock = styled.div`
	width: 100%;
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
	gap: 18px;
	${stepEnter}
`;

const Eyebrow = styled.div`
	text-transform: uppercase;
	font-size: 0.72rem;
	letter-spacing: 0.25em;
	color: var(--text-dim);
	margin-bottom: 8px;
`;

const Hero = styled.h1`
	margin: 0;
	font-size: clamp(2.4rem, 6vw, 4rem);
	line-height: 1.04;
	font-weight: 600;
	letter-spacing: -0.035em;
	color: var(--text);
`;

const HeroAccent = styled.span`
	background: linear-gradient(120deg, var(--accent-bright), #d0bfff 50%, #6ee7f9);
	-webkit-background-clip: text;
	background-clip: text;
	color: transparent;
`;

const Sub = styled.p`
	max-width: 540px;
	margin: 8px 0 24px;
	font-size: 1.05rem;
	line-height: 1.55;
	color: var(--text-muted);
`;

const Counter = styled.div`
	font-size: 0.78rem;
	letter-spacing: 0.18em;
	color: var(--text-dim);
	text-transform: uppercase;
`;

const Question = styled.h2`
	margin: 4px 0 0;
	font-size: clamp(1.6rem, 3.4vw, 2.4rem);
	font-weight: 600;
	letter-spacing: -0.025em;
	color: var(--text);
`;

const Hint = styled.p`
	max-width: 520px;
	margin: 0 0 8px;
	font-size: 0.95rem;
	line-height: 1.55;
	color: var(--text-muted);
`;

const inputBase = css`
	width: 100%;
	max-width: 600px;
	background: var(--surface);
	border: 1px solid var(--border);
	border-radius: var(--radius);
	color: var(--text);
	font-family: inherit;
	font-size: 1.05rem;
	line-height: 1.6;
	padding: 16px 18px;
	transition:
		border-color 0.18s var(--ease-out),
		box-shadow 0.18s var(--ease-out),
		background 0.18s var(--ease-out);

	&::placeholder {
		color: var(--text-dim);
	}

	&:focus {
		outline: none;
		border-color: var(--accent);
		background: var(--surface-2);
		box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.18);
	}
`;

const BigTextarea = styled.textarea`
	${inputBase}
	resize: vertical;
	min-height: 160px;
`;

const BigInput = styled.input`
	${inputBase}
	font-family: var(--font-mono);
	font-size: 1.4rem;
	text-align: center;
	letter-spacing: 0.05em;
`;

const Row = styled.div`
	display: flex;
	gap: 12px;
	align-items: center;
	margin-top: 4px;
`;

const PrimaryBtn = styled.button<{ $glow?: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: 10px;
	background: linear-gradient(180deg, var(--accent-bright), var(--accent));
	color: white;
	border: none;
	border-radius: 999px;
	padding: 13px 26px;
	font-size: 1rem;
	font-weight: 500;
	cursor: pointer;
	transition: transform 0.15s var(--ease-out), box-shadow 0.2s var(--ease-out);
	box-shadow: 0 8px 24px -8px var(--accent-glow), 0 0 0 1px rgba(167, 139, 250, 0.35);
	${(p) =>
		p.$glow &&
		css`
			animation: glowPulse 3.6s ease-in-out infinite;
		`}

	&:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 14px 36px -10px var(--accent-glow), 0 0 0 1px rgba(167, 139, 250, 0.6);
	}

	&:active:not(:disabled) {
		transform: translateY(0);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const GhostBtn = styled.button`
	background: transparent;
	color: var(--text-muted);
	border: 1px solid var(--border);
	border-radius: 999px;
	padding: 12px 22px;
	font-size: 0.95rem;
	cursor: pointer;
	transition: color 0.15s var(--ease-out), border-color 0.15s var(--ease-out);

	&:hover {
		color: var(--text);
		border-color: var(--border-strong);
	}
`;

const Arrow = styled.span`
	display: inline-block;
	transition: transform 0.2s var(--ease-out);
	${PrimaryBtn}:hover & {
		transform: translateX(3px);
	}
`;

const ErrorText = styled.p`
	margin: 0;
	color: var(--danger);
	font-size: 0.9rem;
`;

const Spinner = styled.div`
	width: 32px;
	height: 32px;
	border-radius: 50%;
	border: 2px solid var(--border);
	border-top-color: var(--accent-bright);
	animation: spin 0.8s linear infinite;
`;
