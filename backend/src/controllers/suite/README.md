# controllers/suite/

Express router for the **test suite** owned by an agent. Thin — delegates to `bl/suite`.

- `POST /agents/:agentId/regenerate-suite` — re-run the LLM generator from the current
  agent description. Returns the new suite. Replaces (or versions) the previous one.
- `GET /agents/:agentId/tests` — list tests in the agent's suite.
- `GET /tests/:id` — one test (with generated `tester_instruction` and criteria).
- `PATCH /tests/:id` — edit a test (rename, tweak `tester_instruction`, add/remove
  criteria) before running it.
- `POST /tests/:id/run` — place the outbound call against the agent's `phone_number`,
  create a `run` (`target_kind = 'user_bot'`).
- `POST /agents/:agentId/run-suite` — fan out one `POST /tests/:id/run` per test in the
  agent's suite. Optional `target` query (`user_bot` default; `competitor:<id>` for the
  stretch comparison flow).
