export type Criterion = {
	id: string;
	text: string;
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
