import { eq } from "drizzle-orm";
import { db } from "../database/data-source.ts";
import { agents, type Agent, type NewAgent } from "../database/schemas/agents.ts";

export const createAgent = async (input: {
	name: string;
	phoneNumber: string;
	description: string;
}): Promise<Agent> => {
	const [row] = await db
		.insert(agents)
		.values({
			name: input.name,
			phoneNumber: input.phoneNumber,
			description: input.description,
		} satisfies NewAgent)
		.returning();
	if (!row) throw new Error("createAgent returned no row");
	return row;
};

export const getAgent = async (input: { id: string }): Promise<Agent | null> => {
	const [row] = await db.select().from(agents).where(eq(agents.id, input.id));
	return row ?? null;
};

export const listAgents = async (): Promise<Agent[]> => {
	return db.select().from(agents).orderBy(agents.createdAt);
};

export const updateAgent = async (input: {
	id: string;
	name?: string | undefined;
	phoneNumber?: string | undefined;
	description?: string | undefined;
}): Promise<Agent> => {
	const patch: Partial<NewAgent> = {};
	if (input.name !== undefined) patch.name = input.name;
	if (input.phoneNumber !== undefined) patch.phoneNumber = input.phoneNumber;
	if (input.description !== undefined) patch.description = input.description;
	const [row] = await db
		.update(agents)
		.set(patch)
		.where(eq(agents.id, input.id))
		.returning();
	if (!row) throw new Error("updateAgent: no row for id " + input.id);
	return row;
};
