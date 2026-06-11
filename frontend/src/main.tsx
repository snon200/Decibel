import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { createGlobalStyle } from "styled-components";
import App from "./App";

const queryClient = new QueryClient();

const GlobalStyle = createGlobalStyle`
	:root {
		/* Surfaces */
		--bg: #08080c;
		--bg-elev: #0e0e16;
		--surface: #13131e;
		--surface-2: #181826;
		--border: #25253a;
		--border-strong: #34344f;

		/* Text */
		--text: #f4f4f8;
		--text-muted: #a0a0b5;
		--text-dim: #6c6c85;

		/* Accent — violet/indigo */
		--accent: #8b5cf6;
		--accent-bright: #a78bfa;
		--accent-glow: rgba(139, 92, 246, 0.45);

		/* Status */
		--success: #34d399;
		--warning: #fbbf24;
		--danger: #f87171;
		--info: #60a5fa;

		/* Type */
		--font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
		--font-mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace;

		/* Effects */
		--ease-out: cubic-bezier(0.16, 1, 0.3, 1);
		--radius: 12px;
		--radius-sm: 8px;
	}

	*, *::before, *::after {
		box-sizing: border-box;
	}

	html, body, #app {
		height: 100%;
	}

	body {
		margin: 0;
		font-family: var(--font-sans);
		color: var(--text);
		background: var(--bg);
		background-image:
			radial-gradient(at 20% 0%, rgba(139, 92, 246, 0.10) 0px, transparent 50%),
			radial-gradient(at 80% 100%, rgba(99, 102, 241, 0.08) 0px, transparent 55%);
		background-attachment: fixed;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
		font-feature-settings: "cv02", "cv03", "cv04", "cv11";
		letter-spacing: -0.011em;
	}

	a { color: inherit; }
	button { font-family: inherit; }

	::selection {
		background: var(--accent);
		color: white;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	@keyframes fadeInUp {
		from { opacity: 0; transform: translateY(12px); }
		to { opacity: 1; transform: translateY(0); }
	}

	@keyframes slideInRight {
		from { opacity: 0; transform: translateX(24px); }
		to { opacity: 1; transform: translateX(0); }
	}

	@keyframes slideOutLeft {
		from { opacity: 1; transform: translateX(0); }
		to { opacity: 0; transform: translateX(-24px); }
	}

	@keyframes glowPulse {
		0%, 100% { box-shadow: 0 0 24px var(--accent-glow), 0 0 0 1px rgba(139, 92, 246, 0.3); }
		50% { box-shadow: 0 0 40px var(--accent-glow), 0 0 0 1px rgba(167, 139, 250, 0.5); }
	}

	@keyframes shimmer {
		0% { background-position: -200% 0; }
		100% { background-position: 200% 0; }
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
`;

ReactDOM.createRoot(document.getElementById("app") as HTMLElement).render(
	<React.StrictMode>
		<QueryClientProvider client={queryClient}>
			<GlobalStyle />
			<App />
		</QueryClientProvider>
	</React.StrictMode>,
);
