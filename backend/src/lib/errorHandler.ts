import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { logger } from "./logger.ts";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
	if (err instanceof ZodError) {
		res.status(400).json({
			error: "Invalid request body",
			issues: err.issues,
		});
		return;
	}

	const status =
		typeof err === "object" && err !== null && "status" in err
			? Number((err as { status?: unknown }).status) || 500
			: 500;

	const message =
		err instanceof Error ? err.message : "Internal server error";

	if (status >= 500) {
		logger.error("request failed", { status, message, stack: err instanceof Error ? err.stack : undefined });
	}

	res.status(status).json({ error: message });
};
