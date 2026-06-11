# controllers/agents/

Express router for Agents Under Test. Thin — delegates to `bl/agents`.

- `POST /agents` — create an AUT (`name`, `system_prompt`, `platform`).
- `GET /agents` — list AUTs.
- `GET /agents/:id` — one AUT (with its number/external refs).
- `PATCH /agents/:id` — update prompt/name (propagates to the provider).
