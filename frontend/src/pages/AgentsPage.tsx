import styled from "styled-components";
import AgentForm from "../components/agents/AgentForm";
import AgentList from "../components/agents/AgentList";

export default function AgentsPage() {
	return (
		<Wrap>
			<AgentForm />
			<Section>
				<SectionTitle>Your agents</SectionTitle>
				<AgentList />
			</Section>
		</Wrap>
	);
}

const Wrap = styled.div`
	display: flex;
	flex-direction: column;
	gap: 32px;
`;

const Section = styled.section`
	display: flex;
	flex-direction: column;
	gap: 12px;
`;

const SectionTitle = styled.h2`
	margin: 0;
	font-size: 1.1rem;
`;
