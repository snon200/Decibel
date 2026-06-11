import { config } from "./config.ts";

const authHeaders = (): Record<string, string> => ({
	Authorization: `Bearer ${config.DIAL_API_KEY}`,
	Accept: "application/json",
});

const digits = (s: string): string => s.replace(/\D/g, "");

interface DialNumber {
	id: string;
	number: string;
}

/**
 * Resolve the Dial number id to send from. Prefers the number the call is on
 * (matched against the live X-Dial-Agent-Number header), falling back to the
 * account's first number. `POST /api/v1/messages` requires a fromNumberId.
 */
export const resolveFromNumberId = async (
	agentNumber: string | undefined,
): Promise<string> => {
	const res = await fetch(`${config.DIAL_BASE_URL}/api/v1/numbers`, {
		headers: authHeaders(),
	});
	if (!res.ok) throw new Error(`list numbers failed: ${res.status}`);
	const { numbers } = (await res.json()) as { numbers: DialNumber[] };
	if (numbers.length === 0) throw new Error("no Dial numbers on this account");

	if (agentNumber) {
		const want = digits(agentNumber).slice(-10);
		const match = numbers.find((n) => digits(n.number).slice(-10) === want);
		if (match) return match.id;
	}
	return numbers[0]!.id;
};

export const sendSms = async (input: {
	to: string;
	fromNumberId: string;
	body: string;
}): Promise<void> => {
	const res = await fetch(`${config.DIAL_BASE_URL}/api/v1/messages`, {
		method: "POST",
		headers: { ...authHeaders(), "Content-Type": "application/json" },
		body: JSON.stringify({
			to: input.to,
			fromNumberId: input.fromNumberId,
			body: input.body,
		}),
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`send message failed: ${res.status} ${text}`);
	}
};
