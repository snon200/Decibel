# types/

Shared frontend types — mirror the backend API responses. Keep them in sync with the
backend (ideally these move to a shared package later; for the hackathon, hand-maintained).

## Files

- `agent.ts` — `Agent` (`{ id, name, phoneNumber, description, createdAt }`).
- `test.ts` — `Test`, `Criterion`, `Suite`.
- `run.ts` — `Run`, `RunStatus`, `RunTarget` (`'user_bot' | 'competitor'`), `Score`,
  `RunResult` (transcript + `audioUrl` + scores).
- `competitor.ts` — `Competitor` (`{ id, agentId, platform, phoneNumber, ... }`),
  `Comparison` (the side-by-side scorecard payload).

Migrate the existing `src/types.ts` contents into these files, then delete `types.ts`.
