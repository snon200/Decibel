# controllers/

Express routers — the HTTP edge. Keep them **thin**: parse/validate the request, call one
`bl/` function, shape the response. No business logic, no DB, no vendor calls here.

## Subfolders (one per domain)

- `agents/` — register/list/read AUTs. `POST /agents` (registers + auto-generates the
  suite), `GET /agents`, `GET /agents/:id`, `PATCH /agents/:id`.
- `suite/` — `POST /agents/:id/regenerate-suite`, `GET /agents/:id/tests`,
  `GET /tests/:id`, `PATCH /tests/:id`, `POST /tests/:id/run`,
  `POST /agents/:id/run-suite`.
- `runs/` — `GET /runs/:id` (status + transcript + audio URL + scores; the dashboard
  polls this).
- `competitors/` — (stretch) `POST /agents/:id/competitors` (provision a simulated
  competitor), `GET /agents/:id/competitors`, `GET /agents/:id/comparison`.
- `webhooks/` — inbound webhook receivers (Dial only — competitors don't notify us).

Each subfolder has an `index.ts` exporting a router, mounted in `src/index.ts` via
`app.use("/<name>", router)`. Validate request bodies with Zod.
