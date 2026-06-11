# bl/suite/

Own the **test suite** for an agent. A suite is a list of `Test`s, each with a generated
tester `outboundInstruction` and a list of pass/fail criteria. The user gives us a one-
paragraph agent description; we turn it into a runnable suite.

## Files

- `generateFromDescription.ts` — single LLM call that turns
  `(agent.name + agent.description)` into 5–10 `Test` rows. For each test the LLM emits
  `{ name, scenario_summary, tester_instruction, criteria: [{ id, text }] }`. Persists
  via `dal/tests`. Validates the structured output (Zod), retries once on parse failure.
- `regenerate.ts` — replace (or version) the existing suite from the current description.
  Use when the user edits the description or the previous output was weak.
- `updateTest.ts` — patch a single test (rename, edit `tester_instruction`, add/remove
  criteria). Lets the user tighten anything the LLM got wrong before running.
- `validateCriteria.ts` — each criterion must be non-empty and have a stable `id` so the
  scorecard can map judge output back to the right row.

## Why a suite, not one test at a time

The user's two-input onboarding produces value only if we generate *enough* tests to
exercise the bot meaningfully. Generating the suite as a single LLM call lets us prompt
for coverage (happy path, edge cases, hostile callers, ambiguity) in one shot.

The tester prompt is the system prompt the *outbound* call runs with — it makes the tester
behave like a realistic caller trying to exercise the criteria.
