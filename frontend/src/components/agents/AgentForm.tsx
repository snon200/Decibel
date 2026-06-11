import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useCreateAgent } from "../../hooks/useAgents";

export default function AgentForm() {
	const navigate = useNavigate();
	const createAgent = useCreateAgent();

	const [name, setName] = useState("");
	const [phoneNumber, setPhoneNumber] = useState("+");
	const [description, setDescription] = useState("");

	const submit = (e: React.FormEvent) => {
		e.preventDefault();
		createAgent.mutate(
			{ name, phoneNumber, description },
			{
				onSuccess: ({ agent }) => {
					navigate(`/agents/${agent.id}`);
				},
			},
		);
	};

	const error = createAgent.error;
	const disabled = createAgent.isPending;

	return (
		<Card onSubmit={submit}>
			<Title>Register an agent under test</Title>
			<Subtitle>We'll generate a test suite from the description.</Subtitle>

			<Field>
				<Label htmlFor="name">Name</Label>
				<Input
					id="name"
					type="text"
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="Tony's Pizza receptionist"
					required
				/>
			</Field>

			<Field>
				<Label htmlFor="phone">Phone number (E.164)</Label>
				<Input
					id="phone"
					type="tel"
					value={phoneNumber}
					onChange={(e) => setPhoneNumber(e.target.value)}
					placeholder="+14155551234"
					required
				/>
				<Hint>Include country code, no spaces (e.g. +14155551234).</Hint>
			</Field>

			<Field>
				<Label htmlFor="description">Agent description</Label>
				<Textarea
					id="description"
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					placeholder="Receptionist for Tony's Pizza. Takes table reservations and to-go orders. Knows the menu and hours. Should always confirm name + phone before booking."
					rows={5}
					required
				/>
				<Hint>One paragraph describing what the bot does. This is the only input the test generator gets.</Hint>
			</Field>

			{error && <ErrorText>{(error as Error).message}</ErrorText>}

			<Submit type="submit" disabled={disabled}>
				{disabled ? "Generating suite…" : "Register & generate suite"}
			</Submit>
		</Card>
	);
}

const Card = styled.form`
	background: white;
	border: 1px solid #e5e7eb;
	border-radius: 8px;
	padding: 24px;
	display: flex;
	flex-direction: column;
	gap: 16px;
	max-width: 640px;
`;

const Title = styled.h2`
	margin: 0;
	font-size: 1.2rem;
`;

const Subtitle = styled.p`
	margin: 0;
	color: #6b7280;
	font-size: 0.9rem;
`;

const Field = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
`;

const Label = styled.label`
	font-size: 0.85rem;
	font-weight: 500;
	color: #374151;
`;

const Input = styled.input`
	padding: 8px 10px;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	font-size: 0.95rem;
	&:focus {
		outline: none;
		border-color: #2563eb;
	}
`;

const Textarea = styled.textarea`
	padding: 8px 10px;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	font-size: 0.95rem;
	font-family: inherit;
	resize: vertical;
	&:focus {
		outline: none;
		border-color: #2563eb;
	}
`;

const Hint = styled.span`
	font-size: 0.8rem;
	color: #6b7280;
`;

const Submit = styled.button`
	background: #2563eb;
	color: white;
	border: none;
	border-radius: 6px;
	padding: 10px 16px;
	font-size: 0.95rem;
	font-weight: 500;
	cursor: pointer;
	align-self: flex-start;
	&:hover:not(:disabled) {
		background: #1d4ed8;
	}
	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`;

const ErrorText = styled.p`
	color: #c0392b;
	margin: 0;
	font-size: 0.9rem;
`;
