import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useDeleteAgent } from "../../hooks/useAgents";
import ConfirmDialog from "../ConfirmDialog";

export default function DeleteAgentButton({
	agentId,
	agentName,
}: {
	agentId: string;
	agentName: string;
}) {
	const del = useDeleteAgent();
	const navigate = useNavigate();
	const [open, setOpen] = useState(false);

	const confirm = () => {
		del.mutate(agentId, {
			onSuccess: () => {
				setOpen(false);
				navigate("/agents");
			},
		});
	};

	return (
		<Wrap>
			<Button onClick={() => setOpen(true)} disabled={del.isPending}>
				{del.isPending ? "Deleting…" : "Delete agent"}
			</Button>
			{del.error && <ErrorText>{(del.error as Error).message}</ErrorText>}
			<ConfirmDialog
				open={open}
				title={`Delete "${agentName}"?`}
				body="This permanently removes the agent along with its test suite, runs, and scores. This cannot be undone."
				confirmLabel="Delete agent"
				cancelLabel="Keep agent"
				variant="danger"
				busy={del.isPending}
				onConfirm={confirm}
				onCancel={() => !del.isPending && setOpen(false)}
			/>
		</Wrap>
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
		color: #fca5a5;
		border-color: rgba(239, 68, 68, 0.5);
	}
	&:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const ErrorText = styled.p`
	color: var(--danger);
	margin: 0;
	font-size: 0.85rem;
`;
