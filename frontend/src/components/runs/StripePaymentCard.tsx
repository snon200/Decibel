import styled, { keyframes } from "styled-components";
import type { StripePayment } from "../../utils/stripePayment";

/**
 * Renders a Stripe payment-link SMS as a branded checkout card instead of a raw
 * URL. Styling follows Stripe's public brand: Indigo #635BFF, slate #0A2540,
 * white surface, and the "Powered by Stripe" badge (linked to stripe.com per
 * Stripe's mark guidelines). A light card on the dark dashboard reads instantly
 * as a real payment request.
 */
type Props = {
	payment: StripePayment;
	caption?: string;
};

export default function StripePaymentCard({ payment, caption }: Props) {
	const { url, amountLabel, description, isTestMode } = payment;
	return (
		<Wrap>
			{caption && <Caption>{caption}</Caption>}
			<CardEl>
				<AccentBar />
				<Head>
					<Brand>
						<StripeMark />
						<BrandText>Payment request</BrandText>
					</Brand>
					{isTestMode && <TestBadge>Test mode</TestBadge>}
				</Head>

				<Amount>
					<AmountLabel>Amount due</AmountLabel>
					<AmountValue>{amountLabel ?? "Open amount"}</AmountValue>
					{description && <Desc>{description}</Desc>}
				</Amount>

				<PayButton href={url} target="_blank" rel="noreferrer noopener">
					<LockIcon />
					Pay{amountLabel ? ` ${amountLabel}` : ""}
					<Arrow>→</Arrow>
				</PayButton>

				<Cards aria-hidden>
					<Visa>VISA</Visa>
					<Mastercard>
						<McCircle $c="#EB001B" />
						<McCircle $c="#F79E1B" $overlap />
					</Mastercard>
					<Amex>AMEX</Amex>
				</Cards>

				<Foot>
					<LockIcon $muted />
					<span>Secured payment</span>
					<Dot>·</Dot>
					<Powered href="https://stripe.com" target="_blank" rel="noreferrer noopener">
						<StripeMark $small />
						<PoweredText>stripe</PoweredText>
					</Powered>
				</Foot>
			</CardEl>
		</Wrap>
	);
}

const StripeMark = ({ $small }: { $small?: boolean }) => (
	<svg
		width={$small ? 13 : 18}
		height={$small ? 13 : 18}
		viewBox="0 0 24 24"
		fill={$small ? "#0A2540" : "#635BFF"}
		role="img"
		aria-label="Stripe"
	>
		<path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z" />
	</svg>
);

const LockIcon = ({ $muted }: { $muted?: boolean }) => (
	<svg
		width={$muted ? 12 : 15}
		height={$muted ? 12 : 15}
		viewBox="0 0 24 24"
		fill="none"
		stroke={$muted ? "#8792A2" : "currentColor"}
		strokeWidth="2.2"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden
	>
		<rect x="4.5" y="11" width="15" height="9" rx="2" />
		<path d="M8 11V8a4 4 0 0 1 8 0v3" />
	</svg>
);

const slideUp = keyframes`
	from { opacity: 0; transform: translateY(8px); }
	to { opacity: 1; transform: translateY(0); }
`;

const Wrap = styled.div`
	align-self: stretch;
	width: 100%;
	animation: ${slideUp} 0.35s var(--ease-out);
`;

const Caption = styled.div`
	display: flex;
	align-items: center;
	gap: 6px;
	font-size: 0.68rem;
	color: var(--success);
	margin-bottom: 6px;
	font-variant-numeric: tabular-nums;
`;

const CardEl = styled.div`
	position: relative;
	background: #ffffff;
	border-radius: 16px;
	overflow: hidden;
	box-shadow:
		0 1px 1px rgba(10, 37, 64, 0.08),
		0 12px 32px rgba(10, 37, 64, 0.28),
		0 0 0 1px rgba(10, 37, 64, 0.04);
	font-family:
		-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
`;

const AccentBar = styled.div`
	height: 4px;
	background: linear-gradient(90deg, #635bff 0%, #7a73ff 50%, #00d4ff 100%);
`;

const Head = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 18px 20px 0;
`;

const Brand = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
`;

const BrandText = styled.span`
	font-size: 0.82rem;
	font-weight: 600;
	color: #0a2540;
	letter-spacing: -0.01em;
`;

const TestBadge = styled.span`
	font-size: 0.6rem;
	font-weight: 700;
	letter-spacing: 0.04em;
	text-transform: uppercase;
	color: #a82c00;
	background: #fceeba;
	border: 1px solid #f5da80;
	border-radius: 6px;
	padding: 3px 7px;
`;

const Amount = styled.div`
	padding: 18px 20px 6px;
`;

const AmountLabel = styled.div`
	font-size: 0.68rem;
	font-weight: 600;
	letter-spacing: 0.06em;
	text-transform: uppercase;
	color: #8792a2;
`;

const AmountValue = styled.div`
	font-size: 2rem;
	font-weight: 700;
	color: #0a2540;
	letter-spacing: -0.02em;
	line-height: 1.15;
	margin-top: 2px;
	font-variant-numeric: tabular-nums;
`;

const Desc = styled.div`
	font-size: 0.86rem;
	color: #525f7f;
	margin-top: 4px;
`;

const PayButton = styled.a`
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	margin: 18px 20px 0;
	padding: 13px 16px;
	border-radius: 10px;
	background: #635bff;
	color: #ffffff;
	font-size: 0.92rem;
	font-weight: 600;
	text-decoration: none;
	box-shadow: 0 2px 8px rgba(99, 91, 255, 0.4);
	transition:
		transform 0.15s var(--ease-out),
		background 0.2s,
		box-shadow 0.2s;
	&:hover {
		background: #544dff;
		transform: translateY(-1px);
		box-shadow: 0 6px 18px rgba(99, 91, 255, 0.5);
	}
	&:active {
		transform: translateY(0);
	}
`;

const Arrow = styled.span`
	font-size: 1rem;
	line-height: 1;
	transition: transform 0.15s var(--ease-out);
	${PayButton}:hover & {
		transform: translateX(3px);
	}
`;

const Cards = styled.div`
	display: flex;
	align-items: center;
	gap: 7px;
	padding: 16px 20px 0;
`;

const cardChip = `
	height: 22px;
	min-width: 34px;
	display: grid;
	place-items: center;
	border-radius: 4px;
	font-size: 0.58rem;
	font-weight: 800;
	letter-spacing: 0.02em;
	font-style: italic;
`;

const Visa = styled.span`
	${cardChip}
	background: #1a1f71;
	color: #ffffff;
`;

const Amex = styled.span`
	${cardChip}
	background: #2e77bc;
	color: #ffffff;
	font-style: normal;
`;

const Mastercard = styled.span`
	height: 22px;
	min-width: 34px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 4px;
	background: #f4f4f6;
	border: 1px solid #e6e8eb;
`;

const McCircle = styled.span<{ $c: string; $overlap?: boolean }>`
	width: 12px;
	height: 12px;
	border-radius: 50%;
	background: ${(p) => p.$c};
	opacity: 0.9;
	margin-left: ${(p) => (p.$overlap ? "-5px" : "0")};
`;

const Foot = styled.div`
	display: flex;
	align-items: center;
	gap: 5px;
	padding: 14px 20px 18px;
	margin-top: 16px;
	border-top: 1px solid #eceef1;
	font-size: 0.7rem;
	color: #8792a2;
`;

const Dot = styled.span`
	color: #c4cdd5;
`;

const Powered = styled.a`
	display: inline-flex;
	align-items: center;
	gap: 3px;
	text-decoration: none;
	margin-left: 1px;
`;

const PoweredText = styled.span`
	font-size: 0.78rem;
	font-weight: 700;
	color: #0a2540;
	letter-spacing: -0.02em;
`;
