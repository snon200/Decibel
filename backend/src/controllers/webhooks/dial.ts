import express from "express";
import { logger } from "../../lib/logger.ts";
import { getProvider } from "../../providers/registry.ts";
import * as RunsBl from "../../bl/runs/index.ts";

const router = express.Router();

// Small LRU-ish dedupe for at-least-once redelivery. Capped at 2000 entries.
const seenEventIds = new Set<string>();
const seenEventOrder: string[] = [];
const SEEN_CAPACITY = 2000;
const markSeen = (id: string): boolean => {
	if (seenEventIds.has(id)) return true;
	seenEventIds.add(id);
	seenEventOrder.push(id);
	if (seenEventOrder.length > SEEN_CAPACITY) {
		const evicted = seenEventOrder.shift();
		if (evicted) seenEventIds.delete(evicted);
	}
	return false;
};

const headerMap = (raw: express.Request["headers"]): Record<string, string | undefined> => {
	const out: Record<string, string | undefined> = {};
	for (const [k, v] of Object.entries(raw)) {
		if (typeof v === "string") out[k] = v;
		else if (Array.isArray(v) && v.length > 0) out[k] = v[0];
	}
	return out;
};

router.post("/", (req, res) => {
	const rawBody = Buffer.isBuffer(req.body)
		? (req.body as Buffer).toString("utf8")
		: typeof req.body === "string"
			? req.body
			: "";
	const headers = headerMap(req.headers);
	const eventId = headers["x-dial-event-id"];

	const provider = getProvider("dial");

	if (!provider.verifyWebhook({ rawBody, headers })) {
		logger.warn("dial webhook: signature verification failed");
		res.status(401).end();
		return;
	}

	if (eventId && markSeen(eventId)) {
		logger.info("dial webhook: dedup hit, skipping", { eventId });
		res.status(204).end();
		return;
	}

	const event = provider.parseWebhookEvent({ rawBody, headers });
	if (!event) {
		// Recognized webhook but nothing actionable (e.g. unsupported type).
		res.status(204).end();
		return;
	}

	logger.info("dial webhook accepted", {
		eventId: eventId ?? null,
		type: event.type,
		externalCallId: event.externalCallId,
		status: event.status,
	});

	void RunsBl.ingestCallResult({
		externalCallId: event.externalCallId,
		event,
	}).catch((err) => {
		logger.error("ingestCallResult threw from webhook", {
			externalCallId: event.externalCallId,
			error: err instanceof Error ? err.message : String(err),
		});
	});

	res.status(202).end();
});

export default router;
