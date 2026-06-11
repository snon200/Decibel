# bl/runs/

Execute a test as a real phone call and capture the outcome. This is the heart of the
no-WebSocket lifecycle.

## Files

- `startRun.ts` — create a `run` (status `pending`) with `{ test_id, target_kind,
  target_label, target_phone_number }`, then
  `providers/dial.placeCall({ to: target_phone_number, outboundInstruction:
  test.tester_instruction, ... })`. Save `external_call_id`, set status `dialing`. The
  call now runs on its own. The target is either the user's bot
  (`target_kind = 'user_bot'`) or a provisioned competitor
  (`target_kind = 'competitor'`); this code-path is identical for both.
- `ingestCallResult.ts` — the single funnel for results, called by the reconciliation
  poller. Given an `external_call_id`:
  1. find the run by `external_call_id` (idempotent — short-circuits once resolved),
  2. re-read the canonical `NormalizedCall` from the provider (`getCall`),
  3. update status + duration,
  4. if a transcript is present, store it and trigger `bl/scoring/judge`,
  5. store `audio_url` (for the dashboard player) if the vendor exposes one,
  6. set status `completed` (or `failed`).
- `getRunResult.ts` — assemble run + transcript + scores for the API/dashboard.

## Why one ingest funnel

There are no webhooks — the poller is the only caller. Keeping a single idempotent funnel
(short-circuit on terminal + transcript + score) means repeated polls never double-judge and
every run converges to the same final state.
