# jobs/

Background workers. **No WebSockets, no webhooks** — just `setInterval` polling. This is the
sole mechanism that drives a call to a terminal, judged state.

## Files

- `reconcileRuns.ts` — every few seconds, load every non-terminal run that already has an
  `external_call_id` and feed it into `bl/runs/ingestCallResult`, which re-reads the call via
  `providers/<platform>.getCall`. Idempotent, so repeated polls are harmless.
- `retryFailedJudges.ts` — re-attempt judging for terminal runs that have a transcript but no
  score yet (e.g. a transient LLM error).
- `index.ts` — start/stop the schedulers; wired up from `src/index.ts`.

## Why this exists

With no webhooks, polling is not a safety net — it is the primary path. A tight reconcile
cadence guarantees every run reaches a terminal state and gets judged, without ever opening a
socket or exposing a public callback URL.
