# bl/tests/

Define **tests** (intent + criteria) and generate the **tester agent** prompt.

## Files

- `createTest.ts` — validate and persist `{ agent_id, name, intent, criteria[] }`.
- `generateTesterPrompt.ts` — call `llm/` with the test intent + criteria + the AUT's
  purpose to synthesize a tester `outboundInstruction` (a persona + scenario that probes
  the AUT). Persist it as `tester_instruction`; user can edit before running.
- `validateCriteria.ts` — ensure each criterion is concrete enough to score (non-empty,
  has a stable `id`).

The tester prompt is the system prompt the *outbound* call runs with — it makes the tester
behave like a realistic caller trying to exercise the criteria.
