import type { Test } from "./suite";
import type { Score } from "./scores";

export type CallStatus =
	| "queued"
	| "ringing"
	| "in_progress"
	| "completed"
	| "no_answer"
	| "busy"
	| "failed"
	| "canceled";

export const TERMINAL_STATUSES: readonly CallStatus[] = [
	"completed",
	"no_answer",
	"busy",
	"failed",
	"canceled",
];

export const isTerminal = (status: CallStatus): boolean =>
	TERMINAL_STATUSES.includes(status);

/**
 * Statuses where the user can cancel a run. Mirrors CANCELLABLE_STATUSES on
 * the backend (bl/runs/cancelRun.ts):
 *   - queued / ringing: line hasn't connected yet.
 *   - busy: terminal, but a retry attempt may be queued — cancelling stops it.
 * in_progress is excluded by design — don't cancel mid-call.
 */
export const CANCELLABLE_STATUSES: readonly CallStatus[] = [
	"queued",
	"ringing",
	"busy",
];

export const isCancellable = (status: CallStatus): boolean =>
	CANCELLABLE_STATUSES.includes(status);

export type CorrelatedMessage = {
	id: string;
	from: string;
	to: string;
	body: string;
	channel: string;
	direction: "inbound" | "outbound";
	createdAt: string;
	secondsFromCallEnd: number | null;
};

export type Run = {
	id: string;
	testId: string;
	targetKind: "user_bot" | "competitor";
	targetLabel: string;
	targetPhoneNumber: string;
	provider: string;
	externalCallId: string | null;
	status: CallStatus;
	transcript: string | null;
	messages: CorrelatedMessage[] | null;
	audioUrl: string | null;
	durationSeconds: number | null;
	overallScore: number | null;
	attemptNumber: number;
	error: string | null;
	createdAt: string;
	completedAt: string | null;
};

export type RunDetail = {
	run: Run;
	test: Test;
	scores: Score[];
	audioUrl: string | null;
};
