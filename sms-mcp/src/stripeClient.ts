import { config } from "./config.ts";

export interface CheckoutSession {
	id: string;
	url: string;
}

/**
 * Create a Stripe Checkout Session with an inline (ad-hoc) amount — no
 * pre-created Product/Price needed. Returns the hosted payment page URL, which
 * we text to the caller. Use a test-mode key (sk_test_...) so no real money
 * moves; the caller pays with a test card on the hosted page.
 */
export const createCheckoutSession = async (input: {
	amountCents: number;
	description: string;
	currency?: string;
}): Promise<CheckoutSession> => {
	if (!config.STRIPE_API_KEY) {
		throw new Error("STRIPE_API_KEY is not set");
	}

	const form = new URLSearchParams();
	form.set("mode", "payment");
	form.set("success_url", config.STRIPE_SUCCESS_URL);
	form.set("cancel_url", config.STRIPE_SUCCESS_URL);
	form.set("line_items[0][quantity]", "1");
	form.set("line_items[0][price_data][currency]", input.currency ?? "usd");
	form.set("line_items[0][price_data][unit_amount]", String(input.amountCents));
	form.set(
		"line_items[0][price_data][product_data][name]",
		input.description,
	);

	const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${config.STRIPE_API_KEY}`,
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: form.toString(),
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`stripe checkout session failed: ${res.status} ${text}`);
	}
	const json = (await res.json()) as { id: string; url: string };
	return { id: json.id, url: json.url };
};
