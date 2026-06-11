# providers/dial/

Adapter for **Dial** — the one and only `CallProvider`. Every test run goes out through
this adapter, whether the target is the user's bot or a provisioned competitor.

Auth: `Authorization: Bearer sk_live_...`. Base URL: `https://getdial.ai`.

## What this adapter does

- **`placeCall`** — `POST /api/v1/calls` with `{ to, fromNumberId, outboundInstruction,
  language }`. Sends an `Idempotency-Key` header so a retry never double-dials. Returns
  the call `id` as `externalCallId`.
- **`getCall`** — `GET /api/v1/calls/{id}` → map `{ status, duration, transcript,
  recordingUrl }` to `NormalizedCall` (transcript turns + `audioUrl`). Polled by the
  reconcile job until terminal and used to pull the audio URL for the dashboard player.

## Notes

- The Dial SDK (`@getdial/sdk`) can replace the raw fetches if convenient; the adapter
  boundary stays the same.
- We do **not** use Dial webhooks. Results converge by polling `getCall` from `jobs/`, which
  keeps us socket-free and requires no public callback URL.
- We do **not** provision Dial numbers for the AUT in the MVP flow — the user brings
  their own number on whatever platform. Number-management helpers (`POST /api/v1/numbers`,
  `PATCH /api/v1/numbers/{id}`) may land here later if we add a "host an AUT on Dial"
  mode, but they aren't part of `CallProvider`.
