import { useEffect } from "react";
import styled from "styled-components";

export type ConfirmDialogProps = {
	open: boolean;
	title: string;
	body?: string;
	confirmLabel?: string;
	cancelLabel?: string;
	variant?: "primary" | "danger";
	busy?: boolean;
	onConfirm: () => void;
	onCancel: () => void;
};

export default function ConfirmDialog({
	open,
	title,
	body,
	confirmLabel = "Confirm",
	cancelLabel = "Cancel",
	variant = "primary",
	busy = false,
	onConfirm,
	onCancel,
}: ConfirmDialogProps) {
	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape" && !busy) onCancel();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open, busy, onCancel]);

	if (!open) return null;

	return (
		<Backdrop onClick={() => !busy && onCancel()}>
			<Modal onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
				<Title>{title}</Title>
				{body && <Body>{body}</Body>}
				<Footer>
					<CancelBtn type="button" onClick={onCancel} disabled={busy}>
						{cancelLabel}
					</CancelBtn>
					<ConfirmBtn
						type="button"
						$variant={variant}
						onClick={onConfirm}
						disabled={busy}
						autoFocus
					>
						{busy ? "…" : confirmLabel}
					</ConfirmBtn>
				</Footer>
			</Modal>
		</Backdrop>
	);
}

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

const Modal = styled.div`
	background: var(--bg-elev);
	border: 1px solid var(--border);
	border-radius: var(--radius);
	padding: 24px;
	width: 100%;
	max-width: 440px;
	display: flex;
	flex-direction: column;
	gap: 16px;
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

const Footer = styled.div`
	display: flex;
	gap: 8px;
	justify-content: flex-end;
`;

const CancelBtn = styled.button`
	background: transparent;
	color: var(--text-muted);
	border: 1px solid var(--border);
	border-radius: 999px;
	padding: 8px 16px;
	font-size: 0.9rem;
	cursor: pointer;
	transition: color 0.15s, border-color 0.15s;
	&:hover:not(:disabled) {
		color: var(--text);
		border-color: var(--border-strong);
	}
	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const ConfirmBtn = styled.button<{ $variant: "primary" | "danger" }>`
	background: ${(p) =>
		p.$variant === "danger"
			? "linear-gradient(180deg, #fca5a5, #ef4444)"
			: "linear-gradient(180deg, var(--accent-bright), var(--accent))"};
	color: white;
	border: none;
	border-radius: 999px;
	padding: 8px 18px;
	font-size: 0.9rem;
	font-weight: 500;
	cursor: pointer;
	box-shadow: ${(p) =>
		p.$variant === "danger"
			? "0 4px 12px -4px rgba(239, 68, 68, 0.5)"
			: "0 4px 12px -4px var(--accent-glow)"};
	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;
