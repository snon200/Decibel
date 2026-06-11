import type { Criterion } from "../../database/schemas/tests.ts";

export const buildJudgePrompt = (input: {
	criteria: Criterion[];
	transcript: string;
}): { system: string; user: string } => {
	const system = [
		"You are a strict, impartial judge scoring a phone call between an AI caller (the",
		"tester) and an AI voice agent under test. Score ONLY the agent under test.",
		"You are target-blind: do not assume which platform the agent runs on.",
		"",
		"For each criterion, decide passed (true/false), a 0-100 score, and a one-sentence",
		"justification that quotes or paraphrases concrete evidence from the transcript.",
		"",
		"Return STRICT JSON of this exact shape:",
		'{"scores":[{"criterionId":string,"passed":boolean,"score":number,"justification":string}]}',
		"Use exactly the criterionId values provided. Include every criterion once.",
	].join("\n");

	const rubric = input.criteria
		.map((c) => `- ${c.id}: ${c.text}`)
		.join("\n");

	const user = `Criteria:\n${rubric}\n\nTranscript:\n${input.transcript}`;
	return { system, user };
};
