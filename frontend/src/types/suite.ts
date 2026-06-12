export type CriterionKind = "transcript" | "received_sms" | "sms_content";

export const CRITERION_KIND_LABELS: Record<CriterionKind, string> = {
	transcript: "Transcript",
	received_sms: "Received SMS",
	sms_content: "SMS content",
};

export const CRITERION_KIND_HINTS: Record<CriterionKind, string> = {
	transcript: "Judged against what was said on the call.",
	received_sms: "Pass iff an SMS arrived from the bot during the call.",
	sms_content: "Judged against the SMS body. Auto-fails if no SMS arrived.",
};

export type Criterion = {
	id: string;
	text: string;
	kind?: CriterionKind;
};

export type Test = {
	id: string;
	agentId: string;
	name: string;
	scenarioSummary: string;
	testerInstruction: string;
	criteria: Criterion[];
	createdAt: string;
};

export type UpdateTestInput = {
	name?: string;
	scenarioSummary?: string;
	testerInstruction?: string;
	criteria?: Criterion[];
};

export type RunTarget =
	| { kind: "user_bot" }
	| { kind: "competitor"; competitorId: string };
