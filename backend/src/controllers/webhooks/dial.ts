import express from "express";
import { logger } from "../../lib/logger.ts";
import { getProvider } from "../../providers/registry.ts";
import { ingestCallResult } from "../../bl/runs/index.ts";

const router = express.Router();
const dial = getProvider("dial");

// Mounted in src/index.ts WITH `express.raw({ type: '*/*' })` so req.body is the
// unmodified Buffer needed for HMAC verification.
router.post("/", (req, res) => {
	const rawBody = Buffer.isBuffer(req.body)
		? (req.body as Buffer).toString("utf8")
		: "";

	const headers: Record<string, string | undefined> = {};
	for (const [key, value] of Object.entries(req.headers)) {
		headers[key] = Array.isArray(value) ? value[0] : value;
	}

	if (!dial.verifyWebhook({ rawBody, headers })) {
		logger.warn("dial webhook: invalid signature");
		res.status(401).end();
		return;
	}

	const event = dial.parseWebhookEvent({ rawBody, headers });

	// Ack immediately — Dial retries on non-2xx. Processing is async + idempotent.
	res.status(202).end();

	if (!event) return;
	ingestCallResult({
		providerName: "dial",
		externalCallId: event.externalCallId,
	}).catch((err) => {
		logger.error("dial webhook: ingest failed", {
			externalCallId: event.externalCallId,
			error: err instanceof Error ? err.message : String(err),
		});
	});
});

export default router;
