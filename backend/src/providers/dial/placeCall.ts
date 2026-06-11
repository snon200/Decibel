import { config } from "../../config/env.ts";
import { dialRequest } from "./client.ts";
import { mapDialCall } from "./mapCall.ts";
import type { DialCall } from "./mapCall.ts";
import type { NormalizedCall, PlaceCallInput } from "../types.ts";

export const placeDialCall = async (
	input: PlaceCallInput,
): Promise<NormalizedCall> => {
	const fromNumberId = input.from ?? config.DIAL_FROM_NUMBER_ID;
	if (!fromNumberId) {
		throw new Error("Dial requires a fromNumberId (set DIAL_FROM_NUMBER_ID)");
	}

	const body: Record<string, unknown> = {
		to: input.to,
		fromNumberId,
		outboundInstruction: input.systemPrompt,
	};
	if (input.language) body["language"] = input.language;

	const requestArgs: {
		path: string;
		method: "POST";
		body: unknown;
		idempotencyKey?: string;
	} = {
		path: "/api/v1/calls",
		method: "POST",
		body,
	};
	if (input.idempotencyKey) requestArgs.idempotencyKey = input.idempotencyKey;

	const { call } = await dialRequest<{ call: DialCall }>(requestArgs);
	return mapDialCall(call);
};
