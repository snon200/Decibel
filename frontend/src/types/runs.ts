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
	audioUrl: string | null;
	durationSeconds: number | null;
	overallScore: number | null;
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
