import { and, eq, isNull } from "drizzle-orm";
import { db } from "../database/data-source.ts";
import {
	competitors,
	type Competitor,
	type NewCompetitor,
} from "../database/schemas/competitors.ts";

export const createCompetitor = async (input: {
	agentId: string;
	platform: string;
	externalAgentId: string;
	phoneNumber: string;
	simulationPrompt: string;
}): Promise<Competitor> => {
	const [row] = await db
		.insert(competitors)
		.values({
			agentId: input.agentId,
			platform: input.platform,
			externalAgentId: input.externalAgentId,
			phoneNumber: input.phoneNumber,
			simulationPrompt: input.simulationPrompt,
		} satisfies NewCompetitor)
		.returning();
	if (!row) throw new Error("createCompetitor returned no row");
	return row;
};

export const getCompetitor = async (input: {
	id: string;
}): Promise<Competitor | null> => {
	const [row] = await db
		.select()
		.from(competitors)
		.where(eq(competitors.id, input.id));
	return row ?? null;
};

export const listCompetitorsForAgent = async (input: {
	agentId: string;
}): Promise<Competitor[]> => {
	return db
		.select()
		.from(competitors)
		.where(
			and(eq(competitors.agentId, input.agentId), isNull(competitors.deletedAt)),
		)
		.orderBy(competitors.createdAt);
};

export const softDeleteCompetitor = async (input: {
	id: string;
}): Promise<void> => {
	await db
		.update(competitors)
		.set({ deletedAt: new Date() })
		.where(eq(competitors.id, input.id));
};
