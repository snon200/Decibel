import { llm } from "../../llm/client.ts";
import { buildSimulationPromptRequest } from "../../llm/prompts/simulation.ts";

/**
 * Generate the system prompt a competitor platform should answer with so that
 * its bot behaves like the user's Agent-Under-Test.
 */
export const buildSimulationPrompt = async (input: {
	name: string;
	description: string;
}): Promise<string> => {
	const request = buildSimulationPromptRequest({
		agentName: input.name,
		description: input.description,
	});
	const text = await llm.complete(request);
	return text.trim();
};
