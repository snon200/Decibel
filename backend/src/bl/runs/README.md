# bl/runs/

Execute a test as a real phone call and capture the outcome. This is the heart of the
no-WebSocket lifecycle.

## Files

- `startRun.ts` — create a `run` (status `pending`), then
  `providers/<platform>.placeCall({ to: aut.phone, outboundInstruction: test.tester_instruction, ... })`.
  Save `external_call_id`, set status `dialing`. The call now runs on its own.
- `ingestCallResult.ts` — the single funnel for results, called by **both** the webhook
  handler and the reconciliation poller. Given a `NormalizedCall`/`NormalizedCallEvent`:
  1. find the run by `external_call_id` (idempotent — ignore duplicates),
  2. update status + duration,
  3. if a transcript is present, store it and trigger `bl/scoring/judge`,
  4. set status `completed` (or `failed`).
- `getRunResult.ts` — assemble run + transcript + scores for the API/dashboard.

## Why one ingest funnel

Webhooks and polling can both report the same call. Routing both through
`ingestCallResult` (idempotent on `external_call_id` + event id) means we never double-judge
and the run converges to the same final state no matter which path wins.
