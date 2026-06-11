# providers/dial/

Adapter for **Dial** — the one and only `CallProvider`. Every test run goes out through
this adapter, whether the target is the user's bot or a provisioned competitor.

Auth: `Authorization: Bearer sk_live_...`. Base URL: `https://getdial.ai`.

## What this adapter does

- **`placeCall`** — `POST /api/v1/calls` with `{ to, fromNumberId, outboundInstruction,
  language }`. Sends an `Idempotency-Key` header so a retry never double-dials. Returns
  the call `id` as `externalCallId`.
- **`getCall`** — `GET /api/v1/calls/{id}` → map `{ status, duration, transcript,
  recordingUrl }` to `NormalizedCall` (transcript turns + `audioUrl`). Used by the
  reconciliation poller and to pull the audio URL for the dashboard player.
- **`verifyWebhook`** — recompute HMAC-SHA256 over `{t}.{rawBody}` using the subscription
  secret (`whsec_…`), compare against `X-Dial-Signature` (`t=…,v1=…`), reject if older
  than 5 min.
- **`parseWebhookEvent`** — handle `call.ended` (terminal status, duration) and
  `call.transcribed` (transcript ready). Dedupe on `X-Dial-Event-ID`. `call.transcribed`
  is thin, so fetch the transcript + audio via `getCall`.

## Notes

- The Dial SDK (`@getdial/sdk`) can replace the raw fetches if convenient; the adapter
  boundary stays the same.
- Webhooks are at-least-once with up to 6 delivery attempts — our handler must be
  idempotent. The event stream / `wait-for` long-poll exist too, but we standardize on
  **webhook + `getCall` polling** to stay socket-free.
- We do **not** provision Dial numbers for the AUT in the MVP flow — the user brings
  their own number on whatever platform. Number-management helpers (`POST /api/v1/numbers`,
  `PATCH /api/v1/numbers/{id}`) may land here later if we add a "host an AUT on Dial"
  mode, but they aren't part of `CallProvider`.
