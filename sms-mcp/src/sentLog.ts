/**
 * In-memory record of every text/payment-link a bot-under-test asked us to send
 * via the webhook tools. This is the *evidence source* the backend reads to
 * credit SMS/payment criteria for ElevenLabs (and other non-Dial) agents, which
 * can't be correlated by polling Dial's message log.
 *
 * Ephemeral on purpose: the backend ingests it seconds after a call ends, so a
 * bounded ring buffer is plenty and survives the only window that matters.
 */
export interface SentRecord {
	id: string;
	kind: "sms" | "payment";
	to: string;
	body: string;
	paymentUrl?: string;
	conversationId?: string;
	delivered: boolean;
	createdAt: string;
}

const MAX_RECORDS = 500;
const records: SentRecord[] = [];

export const appendSent = (
	record: Omit<SentRecord, "id" | "createdAt">,
): SentRecord => {
	const full: SentRecord = {
		...record,
		id: `snt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
		createdAt: new Date().toISOString(),
	};
	records.push(full);
	if (records.length > MAX_RECORDS) records.splice(0, records.length - MAX_RECORDS);
	return full;
};

const digits = (s: string): string => s.replace(/\D/g, "");

/** Last-N-digits match so +972…, 0…, and spacing variants still line up. */
const samePhone = (a: string, b: string): boolean => {
	const da = digits(a);
	const db = digits(b);
	if (!da || !db) return false;
	const len = Math.min(da.length, db.length, 10);
	return da.slice(-len) === db.slice(-len);
};

export const querySent = (filter: {
	since?: string;
	to?: string;
}): SentRecord[] => {
	const sinceMs = filter.since ? new Date(filter.since).getTime() : null;
	return records.filter((r) => {
		if (sinceMs !== null && new Date(r.createdAt).getTime() < sinceMs) return false;
		if (filter.to && !samePhone(r.to, filter.to)) return false;
		return true;
	});
};
