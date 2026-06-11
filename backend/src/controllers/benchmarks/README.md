# controllers/benchmarks/

Express router for the "Us vs competitors" benchmark. Thin — delegates to `bl/benchmarks`.

- `POST /benchmarks` — run a test across platforms (`test_id`, `platforms[]`).
- `GET /benchmarks/:id` — side-by-side scorecard (per platform: per-criterion + overall).
