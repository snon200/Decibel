# api/

Typed HTTP client functions — the only place the frontend knows backend URLs. One file per
backend domain, built on the shared `apiGet`/`apiPost` helpers.

## Files

- `agents.ts` — `listAgents`, `getAgent`, `createAgent`, `updateAgent`.
- `tests.ts` — `createTest`, `getTest`, `generateTester`.
- `runs.ts` — `startRun`, `getRun`.
- `benchmarks.ts` — `createBenchmark`, `getBenchmark`.

Functions return typed data from `types/`; no React here. `hooks/` wraps these with React
Query.
