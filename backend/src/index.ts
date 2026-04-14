import express from "express";
import cors from "cors";
import accountsController from "./controllers/accounts/index.ts";
import personsController from "./controllers/persons/index.ts";
import transactionsController from "./controllers/transactions/index.ts";

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/accounts", accountsController);
app.use("/persons", personsController);
app.use("/transactions", transactionsController);

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
