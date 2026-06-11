import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import styled from "styled-components";
import AgentsPage from "./pages/AgentsPage";
import AgentDetailPage from "./pages/AgentDetailPage";
import RunDetailPage from "./pages/RunDetailPage";

export default function App() {
	document.title = "Agent Arena";

	return (
		<BrowserRouter>
			<AppShell>
				<TopNav>
					<NavTitle to="/agents">Agent Arena</NavTitle>
				</TopNav>
				<Container>
					<Routes>
						<Route path="/" element={<Navigate to="/agents" replace />} />
						<Route path="/agents" element={<AgentsPage />} />
						<Route path="/agents/:agentId" element={<AgentDetailPage />} />
						<Route path="/runs/:runId" element={<RunDetailPage />} />
						<Route path="*" element={<NotFound />} />
					</Routes>
				</Container>
			</AppShell>
		</BrowserRouter>
	);
}

const NotFound = () => <p>Not found.</p>;

const AppShell = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: 24px;
`;

const TopNav = styled.nav`
	display: flex;
	align-items: center;
	padding-bottom: 16px;
	border-bottom: 1px solid #e2e6ee;
	margin-bottom: 24px;
`;

const NavTitle = styled(Link)`
	font-size: 1.4rem;
	font-weight: 600;
	color: #1f2937;
	text-decoration: none;
	&:hover {
		color: #2563eb;
	}
`;

const Container = styled.main`
	display: flex;
	flex-direction: column;
	gap: 32px;
`;
