# api/

Typed HTTP client functions — the only place the frontend knows backend URLs. One file per
backend domain, built on the shared `apiGet`/`apiPost` helpers.

## Files

- `agents.ts` — `listAgents`, `getAgent`, `createAgent` (returns the agent + initial
  suite), `updateAgent`.
- `suite.ts` — `regenerateSuite`, `getTest`, `updateTest`, `startTestRun`, `startSuiteRun`.
- `runs.ts` — `getRun` (status + transcript + `audioUrl` + scorecard).
- `competitors.ts` — `provisionCompetitor`, `listCompetitors`, `deleteCompetitor`,
  `getComparison`.

Functions return typed data from `types/`; no React here. `hooks/` wraps these with React
Query.
