# hooks/

React Query hooks wrapping the `api/` functions — caching, loading/error state, and
**polling** for live run status (no WebSocket on the client either).

## Files

- `useAgents.ts` — `useAgents`, `useAgent`, `useCreateAgent`, `useUpdateAgent`.
- `useTests.ts` — `useTest`, `useCreateTest`, `useGenerateTester`.
- `useRun.ts` — `useStartRun`, and `useRun(id)` with `refetchInterval` while the run is
  non-terminal (poll `GET /runs/:id` until `completed`/`failed`).
- `useBenchmark.ts` — `useCreateBenchmark`, `useBenchmark(id)` (also polls until all child
  runs finish).

Keep components free of fetching logic — they consume these hooks.
