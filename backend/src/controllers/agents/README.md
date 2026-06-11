# controllers/agents/

Express router for Agents Under Test. Thin — delegates to `bl/agents`.

- `POST /agents` — register an AUT with `{ name, phoneNumber, description }`. Also
  triggers `bl/suite.generateFromDescription` so the response includes the initial suite.
- `GET /agents` — list AUTs (with a suite summary per agent).
- `GET /agents/:id` — one AUT plus its current suite.
- `PATCH /agents/:id` — update the name or description. Editing the description prompts
  the dashboard to offer "regenerate suite" (handled by `controllers/suite`).
