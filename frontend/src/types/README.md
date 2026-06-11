# types/

Shared frontend types — mirror the backend API responses. Keep them in sync with the
backend (ideally these move to a shared package later; for the hackathon, hand-maintained).

## Files

- `agent.ts` — `Agent`, `Platform` (`'dial' | 'vapi' | 'elevenlabs'`).
- `test.ts` — `Test`, `Criterion`.
- `run.ts` — `Run`, `RunStatus`, `Score`, `RunResult`.
- `benchmark.ts` — `Benchmark`, `BenchmarkScorecard`.

Migrate the existing `src/types.ts` contents into these files, then delete `types.ts`.
