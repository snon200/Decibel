import { z } from "zod";
import { complete } from "../../llm/client.ts";
import { buildSuitePrompt } from "../../llm/prompts/suitePrompt.ts";
import { LlmParseError } from "../../lib/errors.ts";
import type { NewTestInput } from "../../dal/tests.ts";

const suiteSchema = z.object({
	tests: z
		.array(
			z.object({
				name: z.string().min(1),
				scenarioSummary: z.string().min(1),
				testerInstruction: z.string().min(1),
				criteria: z.array(z.object({ text: z.string().min(1) })).min(1),
			}),
		)
		.min(1),
});

export type SuiteDraft = Omit<NewTestInput, "agentId">;

/**
 * One LLM call → a validated suite draft. Criterion ids are assigned here (c1,
 * c2, …) so they're stable and unique regardless of what the model emits — the
 * scorecard maps judge output back to these ids.
 */
export const generateSuiteDraft = async (input: {
	name: string;
	description: string;
}): Promise<SuiteDraft[]> => {
	const { system, user } = buildSuitePrompt(input);
	const raw = await complete({ system, user, json: true, temperature: 0.7 });

	const parsed = suiteSchema.safeParse(raw);
	if (!parsed.success) throw new LlmParseError(parsed.error.message);

	return parsed.data.tests.map((test) => ({
		name: test.name,
		scenarioSummary: test.scenarioSummary,
		testerInstruction: test.testerInstruction,
		criteria: test.criteria.map((c, i) => ({ id: `c${i + 1}`, text: c.text })),
	}));
};

export const draftToTests = (input: {
	agentId: string;
	draft: SuiteDraft[];
}): NewTestInput[] =>
	input.draft.map((d) => ({ agentId: input.agentId, ...d }));
