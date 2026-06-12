import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { config } from "./config.ts";
import { buildMcpServer } from "./mcp.ts";
import { handlePaymentWebhook, handleSmsWebhook } from "./webhookTools.ts";
import { querySent } from "./sentLog.ts";

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
	res.json({ ok: true });
});

// Plain HTTP webhook tools for non-Dial agents (e.g. an ElevenLabs AUT). The
// agent templates {{system__caller_id}} into the X-Caller-Id header.
app.post("/tools/sms", handleSmsWebhook);
app.post("/tools/payment", handlePaymentWebhook);

// Evidence feed: the backend reads this to credit SMS/payment criteria for
// agents we can't correlate via Dial's message log.
app.get("/sent-log", (req, res) => {
	const since = typeof req.query.since === "string" ? req.query.since : undefined;
	const to = typeof req.query.to === "string" ? req.query.to : undefined;
	res.json({ sent: querySent({ ...(since ? { since } : {}), ...(to ? { to } : {}) }) });
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
