import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { createGlobalStyle } from "styled-components";
import App from "./App";

const queryClient = new QueryClient();

const GlobalStyle = createGlobalStyle`
	body {
		font-family: "Segoe UI", Tahoma, sans-serif;
		background: #f6f8fb;
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
