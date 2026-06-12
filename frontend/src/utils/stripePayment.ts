/**
 * Detects and parses the Stripe payment-link SMS our agents send. The body is
 * minted in sms-mcp as:
 *   `Here's your secure payment link for ${description} ($${amount}): ${url}`
 * but we parse defensively so any "stripe.com" link in a text still renders the
 * branded card instead of a raw URL.
 */
export type StripePayment = {
	url: string;
	/** Pre-formatted amount incl. currency symbol, e.g. "$250.00". */
	amountLabel: string | null;
	description: string | null;
	/** Stripe test-mode sessions are prefixed cs_test_ / live are cs_live_. */
	isTestMode: boolean;
};

const URL_RE = /(https?:\/\/[^\s)]+)/i;
const AMOUNT_RE = /\$\s?(\d[\d,]*(?:\.\d{1,2})?)/;
const DESC_RE = /payment link for\s+(.+?)\s*(?:\(\$|:\s*https?:|$)/i;

const isStripeUrl = (url: string): boolean => /(^|\.)stripe\.com\//i.test(url);

export const parseStripePayment = (body: string): StripePayment | null => {
	if (!body) return null;
	const urlMatch = body.match(URL_RE);
	if (!urlMatch) return null;
	const url = urlMatch[1]!.replace(/[.,]+$/, "");
	if (!isStripeUrl(url)) return null;

	const amount = body.match(AMOUNT_RE);
	const desc = body.match(DESC_RE);

	return {
		url,
		amountLabel: amount ? `$${amount[1]}` : null,
		description: desc?.[1]?.trim() || null,
		isTestMode: /cs_test_|\/test\//i.test(url) || !/cs_live_/i.test(url),
	};
};
