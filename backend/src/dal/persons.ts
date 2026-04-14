import { asc, eq } from "drizzle-orm";
import { db } from "../database/data-source.ts";
import { persons } from "../database/schemas/persons.ts";
import type { Person } from "../database/schemas/persons.ts";

class PersonsDAL {
	static async getPersons(): Promise<Person[]> {
		return await db.select().from(persons).orderBy(asc(persons.name));
	}

	static async getPersonById(personId: string): Promise<Person | null> {
		const [person] = await db
			.select()
			.from(persons)
			.where(eq(persons.personId, personId))
			.limit(1);

		return person ?? null;
	}

	static async createPerson(person: Omit<Person, "personId">): Promise<Person> {
		const [saved] = await db.insert(persons).values(person).returning();

		if (!saved) throw new Error("Failed to create person");

		return saved;
	}
}

export default PersonsDAL;
