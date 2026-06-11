import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import styled from "styled-components";
import AgentsPage from "./pages/AgentsPage";
import AgentDetailPage from "./pages/AgentDetailPage";
import RunDetailPage from "./pages/RunDetailPage";

export default function App() {
	document.title = "Agent Arena";

	return (
		<BrowserRouter>
			<Shell />
		</BrowserRouter>
	);
}

const Shell = () => {
	const { pathname } = useLocation();
	const onLanding = pathname === "/" || pathname === "/agents";

	return (
		<AppShell>
			{!onLanding && (
				<TopNav>
					<NavBrand to="/agents">
						<Dot /> Agent Arena
					</NavBrand>
				</TopNav>
			)}
			<Routes>
				<Route path="/" element={<Navigate to="/agents" replace />} />
				<Route path="/agents" element={<AgentsPage />} />
				<Route path="/agents/:agentId" element={<AgentDetailPage />} />
				<Route path="/runs/:runId" element={<RunDetailPage />} />
				<Route path="*" element={<NotFound />} />
			</Routes>
		</AppShell>
	);
};

const NotFound = () => (
	<Centered>
		<h1>404</h1>
		<p>Couldn't find that page.</p>
	</Centered>
);

const AppShell = styled.div`
	min-height: 100vh;
	display: flex;
	flex-direction: column;
`;

const TopNav = styled.nav`
	display: flex;
	align-items: center;
	padding: 16px 32px;
	border-bottom: 1px solid var(--border);
	background: rgba(8, 8, 12, 0.75);
	backdrop-filter: blur(12px);
	position: sticky;
	top: 0;
	z-index: 10;
	animation: fadeIn 0.4s var(--ease-out);
`;

const NavBrand = styled(Link)`
	display: inline-flex;
	align-items: center;
	gap: 10px;
	font-size: 0.95rem;
	font-weight: 600;
	letter-spacing: -0.02em;
	color: var(--text);
	text-decoration: none;
	transition: color 0.15s var(--ease-out);
	&:hover {
		color: var(--accent-bright);
	}
`;

const Dot = styled.span`
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background: var(--accent-bright);
	box-shadow: 0 0 12px var(--accent-glow);
`;

const Centered = styled.div`
	margin: auto;
	text-align: center;
	color: var(--text-muted);
`;
