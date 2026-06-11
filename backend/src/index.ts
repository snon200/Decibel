import express from "express";
import cors from "cors";
import agentsRouter from "./controllers/agents/index.ts";
import suiteRouter from "./controllers/suite/index.ts";
import runsRouter from "./controllers/runs/index.ts";
import competitorsRouter from "./controllers/competitors/index.ts";
import { errorHandler } from "./lib/errorHandler.ts";
import { startJobs } from "./jobs/index.ts";

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
	res.status(200).json({ status: "ok" });
});

app.use(agentsRouter);
app.use(suiteRouter);
app.use(runsRouter);
app.use(competitorsRouter);

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
