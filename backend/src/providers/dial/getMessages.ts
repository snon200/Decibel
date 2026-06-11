import { dialRequest } from "./client.ts";
import type { ListMessagesInput, NormalizedMessage } from "../types.ts";

export interface DialMessage {
	id: string;
	from: string;
	to: string;
	body: string;
	channel?: string | null;
	direction?: string | null;
	status?: unknown;
	createdAt?: string | null;
}

/**
 * `GET /api/v1/messages` — recent SMS on the account (newest first, up to 100),
 * with optional numberId / direction / since filters. Used to correlate inbound
 * SMS to a call by phone number + time, since Dial exposes no call↔message link.
 */
export const listDialMessages = async (
	input: ListMessagesInput = {},
): Promise<NormalizedMessage[]> => {
	const params = new URLSearchParams();
	if (input.numberId) params.set("numberId", input.numberId);
	if (input.direction) params.set("direction", input.direction);
	if (input.since) params.set("since", input.since);
	const qs = params.toString();

	const { messages } = await dialRequest<{ messages: DialMessage[] }>({
		path: `/api/v1/messages${qs ? `?${qs}` : ""}`,
	});

	return messages.map((m) => ({
		id: m.id,
		from: m.from,
		to: m.to,
		body: m.body,
		channel: m.channel ?? "sms",
		direction: m.direction === "outbound" ? "outbound" : "inbound",
		createdAt: m.createdAt ?? new Date().toISOString(),
	}));
};
