import express from "express";
import { logger } from "../../lib/logger.ts";
import { NotImplementedError } from "../../lib/errors.ts";

const router = express.Router();

// Dial webhook receiver. Mounted in src/index.ts WITH `express.raw({ type: '*/*' })`
// so that req.body is a Buffer of the unmodified bytes (needed for HMAC).
//
// Full implementation lands when providers/dial.verifyWebhook + parseWebhookEvent
// and bl/runs.ingestCallResult are wired. For now: parse + log + 202 ack so the
// route exists, the raw-body mount is exercised, and Dial doesn't see 404s during
// early integration testing.
router.post("/", (req, res) => {
	const rawBody = Buffer.isBuffer(req.body)
		? (req.body as Buffer).toString("utf8")
		: "";
	logger.info("dial webhook received (unverified, no ingest)", {
		bytes: rawBody.length,
		signaturePresent: Boolean(req.header("x-dial-signature")),
		eventId: req.header("x-dial-event-id") ?? null,
	});
	// Intentionally return 202 to acknowledge receipt without acting on it.
	// Will be replaced with verify → parse → ingestCallResult → 202.
	void new NotImplementedError("webhooks/dial: verify + ingest pending");
	res.status(202).end();
});

export default router;
