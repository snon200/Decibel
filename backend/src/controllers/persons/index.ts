import express from "express";
import PersonsDAL from "../../dal/persons.ts";

const router = express.Router();

// GET /persons/:id - get a single person
router.get("/:id", async (req, res) => {
	const personId = req.params.id;
	const person = await PersonsDAL.getPersonById(personId);
	if (!person) {
		res.status(404).json({ error: "Person not found" });
		return;
	}
	res.status(200).json(person);
});

export default router;
