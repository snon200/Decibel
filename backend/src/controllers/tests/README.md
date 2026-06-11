# controllers/tests/

Express router for test definitions. Thin — delegates to `bl/tests`.

- `POST /tests` — create a test (`agent_id`, `name`, `intent`, `criteria[]`).
- `POST /tests/:id/generate-tester` — AI-generate the tester prompt (editable after).
- `GET /tests/:id` — one test (with generated tester instruction).
