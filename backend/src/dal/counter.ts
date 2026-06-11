import { eq, sql } from "drizzle-orm";
import { db } from "../database/data-source.ts";
import { counter, type Counter } from "../database/schemas/counter.ts";

const COUNTER_ID = 1;

const ensureRow = async (): Promise<void> => {
	await db
		.insert(counter)
		.values({ id: COUNTER_ID, value: 0 })
		.onConflictDoNothing();
};

export const getCounter = async (): Promise<Counter> => {
	await ensureRow();
	const [row] = await db
		.select()
		.from(counter)
		.where(eq(counter.id, COUNTER_ID));
	if (!row) throw new Error("Counter row missing after ensureRow");
	return row;
};

export const adjustCounter = async (delta: number): Promise<Counter> => {
	await ensureRow();
	const [row] = await db
		.update(counter)
		.set({ value: sql`${counter.value} + ${delta}` })
		.where(eq(counter.id, COUNTER_ID))
		.returning();
	if (!row) throw new Error("Counter row missing after update");
	return row;
};
