# dal/

Data Access Layer — thin query helpers over the Drizzle tables. **No business logic, no
vendor calls.** Just typed CRUD that the `bl/` layer composes.

## Files (one per table)

- `agents.ts` — `createAgent`, `getAgent`, `listAgents`, `updateAgent`.
- `tests.ts` — `bulkCreateTests` (suite generation writes many at once), `getTest`,
  `listTestsForAgent`, `updateTest`, `replaceSuiteForAgent`.
- `runs.ts` — `createRun`, `getRun`, `getRunByExternalCallId`, `updateRunStatus`,
  `setRunResult` (transcript + `audio_url` + duration), `listStaleRuns` (for the
  reconciler).
- `scores.ts` — `insertScores`, `getScoresForRun`.
- `competitors.ts` — `createCompetitor`, `getCompetitor`, `listCompetitorsForAgent`,
  `softDeleteCompetitor`.

## Rules

- Every function takes a single object param (`{ ... }`), never positional args.
- Return plain typed rows; let `bl/` decide what to do with them.
- `getRunByExternalCallId` is what the reconcile poller uses to map a vendor call back to a run.
