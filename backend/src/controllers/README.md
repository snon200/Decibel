# controllers/

Express routers — the HTTP edge. Keep them **thin**: parse/validate the request, call one
`bl/` function, shape the response. No business logic, no DB, no vendor calls here.

## Subfolders (one per domain)

- `agents/` — CRUD for Agents Under Test. `POST /agents`, `GET /agents`, `GET /agents/:id`,
  `PATCH /agents/:id`.
- `tests/` — `POST /tests`, `POST /tests/:id/generate-tester`, `GET /tests/:id`.
- `runs/` — `POST /tests/:id/run` (start a run), `GET /runs/:id` (status + transcript +
  scores; the dashboard polls this).
- `benchmarks/` — `POST /benchmarks` (fan a test across platforms), `GET /benchmarks/:id`.
- `webhooks/` — inbound webhook receivers for each provider (the result channel).

Each subfolder has an `index.ts` exporting a router, mounted in `src/index.ts` via
`app.use("/<name>", router)`. Validate request bodies with Zod.
