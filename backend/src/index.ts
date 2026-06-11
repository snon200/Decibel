import express from "express";
import cors from "cors";
import counterController from "./controllers/counter/index.ts";

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
	res.status(200).json({ status: "ok" });
});

app.use("/counter", counterController);

const startServer = async () => {
	try {
		app.listen(port, () => {
			console.log(`Server running at http://localhost:${port}`);
		});
	} catch (err) {
		console.error("Error starting server:", err);
		process.exit(1);
	}
};

void startServer();
