# providers/dial/

Adapter for **Dial** — our primary platform and the one the Agent Under Test runs on.

Auth: `Authorization: Bearer sk_live_...`. Base URL: `https://getdial.ai`.

## What this adapter does

- **`placeCall`** — `POST /api/v1/calls` with `{ to, fromNumberId, outboundInstruction, language }`.
  Sends an `Idempotency-Key` header so a retry never double-dials. Returns the call `id` as
  `externalCallId`.
- **`getCall`** — `GET /api/v1/calls/{id}` → map `{ status, duration, transcript }` to
  `NormalizedCall`. Used by the reconciliation poller.
- **`verifyWebhook`** — recompute HMAC-SHA256 over `{t}.{rawBody}` using the subscription
  secret (`whsec_…`), compare against `X-Dial-Signature` (`t=…,v1=…`), reject if older
  than 5 min.
- **`parseWebhookEvent`** — handle `call.ended` (terminal status, duration) and
  `call.transcribed` (transcript ready). Dedupe on `X-Dial-Event-ID`. `call.transcribed`
  is thin, so fetch the transcript via `getCall`.

## Number management (for setting up an AUT)

A Dial Agent Under Test *is* a phone number with an `inboundInstruction`. Helpers here also
cover:

- `POST /api/v1/numbers` — purchase a number (optional `inboundInstruction`, `country`, `areaCode`).
- `PATCH /api/v1/numbers/{id}` — set/update `inboundInstruction` and `nickname`.
- `GET /api/v1/numbers` — list numbers.

(These may live in a small `numbers.ts` alongside the call files since they're Dial-specific.)

## Notes

- The Dial SDK (`@getdial/sdk`) can replace the raw fetches if convenient; the adapter
  boundary stays the same.
- Webhooks are at-least-once with up to 6 delivery attempts — our handler must be
  idempotent. The event stream / `wait-for` long-poll exist too, but we standardize on
  **webhook + `getCall` polling** to stay socket-free and uniform across vendors.
