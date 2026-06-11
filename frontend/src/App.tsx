import styled from "styled-components";
import Counter from "./components/Counter";

export default function App() {
	document.title = "Dial";

	return (
		<AppShell>
			<Container>
				<PageTitle>Dial</PageTitle>
				<Counter />
			</Container>
		</AppShell>
	);
}

const AppShell = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: 24px;
`;

const Container = styled.main`
	display: flex;
	flex-direction: column;
	gap: 40px;
`;

const PageTitle = styled.h1`
	margin: 0;
	font-size: 1.6rem;
`;
