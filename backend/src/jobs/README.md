# jobs/

Background workers. **No WebSockets** — just `setInterval`/cron-style polling. These make
result capture reliable when a webhook is missed or delayed.

## Files

- `reconcileRuns.ts` — periodically (e.g. every 15–30s) load runs stuck in
  `dialing`/`in_progress` past a small grace period, call
  `providers/<platform>.getCall(external_call_id)`, and feed the result into
  `bl/runs/ingestCallResult`. Idempotent, so it's harmless if the webhook already handled
  the run.
- `index.ts` — start/stop the schedulers; wired up from `src/index.ts`.

## Why this exists

Webhooks are fast but need a reachable public URL and can be missed (server restart, tunnel
blip). Polling is the safety net that guarantees every run eventually reaches a terminal
state. Together: webhook for latency, poller for reliability — and never a socket.
