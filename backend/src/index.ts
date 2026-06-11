import express from "express";
import cors from "cors";
import agentsRouter from "./controllers/agents/index.ts";
import suiteRouter from "./controllers/suite/index.ts";
import runsRouter from "./controllers/runs/index.ts";
import dialWebhookRouter from "./controllers/webhooks/dial.ts";
import { errorHandler } from "./lib/errorHandler.ts";
import { startJobs } from "./jobs/index.ts";

const app = express();
const port = 3000;

app.use(cors());

// Raw body for Dial webhook (HMAC verification needs the unmodified bytes).
// MUST be mounted before express.json().
app.use("/webhooks/dial", express.raw({ type: "*/*" }), dialWebhookRouter);

app.use(express.json());

app.get("/health", (_req, res) => {
	res.status(200).json({ status: "ok" });
});

app.use(agentsRouter);
app.use(suiteRouter);
app.use(runsRouter);

app.use(errorHandler);

const startServer = async () => {
	try {
		app.listen(port, () => {
			console.log(`Server running at http://localhost:${port}`);
			startJobs();
		});
	} catch (err) {
		console.error("Error starting server:", err);
		process.exit(1);
	}
};

void startServer();
