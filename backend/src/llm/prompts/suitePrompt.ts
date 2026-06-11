export const buildSuitePrompt = (input: {
	name: string;
	description: string;
}): { system: string; user: string } => {
	const system = [
		"You design phone-call test suites for evaluating AI voice agents.",
		"Given an agent's name and description, produce 5-8 distinct tests that exercise it",
		"meaningfully: the happy path, edge cases, ambiguous requests, and hostile or",
		"confused callers.",
		"",
		"Return STRICT JSON of this exact shape:",
		'{"tests":[{"name":string,"scenarioSummary":string,"testerInstruction":string,"criteria":[{"text":string}]}]}',
		"",
		"Rules:",
		"- testerInstruction is the SYSTEM PROMPT for an AI caller that will phone the agent.",
		"  Write it in the second person: tell the caller who they are, what they want, how to",
		"  behave, and to hang up once the scenario is resolved or clearly failed.",
		"- scenarioSummary is one human-readable sentence describing the test.",
		"- Each criterion.text is a single, objective yes/no pass condition for the agent.",
		"- 2-5 criteria per test. Do not include ids — they are assigned downstream.",
	].join("\n");

	const user = `Agent name: ${input.name}\n\nAgent description:\n${input.description}`;
	return { system, user };
};
