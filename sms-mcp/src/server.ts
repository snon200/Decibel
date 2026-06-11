import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { config } from "./config.ts";
import { buildMcpServer } from "./mcp.ts";

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
	res.json({ ok: true });
});

// Stateless MCP: a fresh server + transport per request, so we can bind the
// live X-Dial-* call headers into the send_sms tool's context.
app.post("/mcp", async (req, res) => {
	const server = buildMcpServer({
		direction: req.header("X-Dial-Direction"),
		userNumber: req.header("X-Dial-User-Number"),
		agentNumber: req.header("X-Dial-Agent-Number"),
	});
	const transport = new StreamableHTTPServerTransport({
		sessionIdGenerator: undefined,
	});
	res.on("close", () => {
		void transport.close();
		void server.close();
	});
	try {
		await server.connect(transport);
		await transport.handleRequest(req, res, req.body);
	} catch (err) {
		console.error("mcp request error", err);
		if (!res.headersSent) res.status(500).json({ error: "internal error" });
	}
});

const methodNotAllowed = (_req: express.Request, res: express.Response) => {
	res.status(405).json({ error: "method not allowed" });
};
app.get("/mcp", methodNotAllowed);
app.delete("/mcp", methodNotAllowed);

app.listen(config.PORT, () => {
	console.log(`sms-mcp listening on http://localhost:${config.PORT}/mcp`);
});
