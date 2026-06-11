# providers/vapi/

Adapter for **VAPI** — used by the "Us vs competitors" benchmark.

Auth: `Authorization: Bearer <VAPI_API_KEY>`. Base URL: `https://api.vapi.ai`.

## What this adapter does

- **`placeCall`** — `POST /call` with:
  - `phoneNumberId` — a VAPI/imported number to call from.
  - `customer.number` — the destination (the AUT's number).
  - `assistant` (transient) **or** `assistantId` — carries the system prompt. For the
    benchmark we send a transient `assistant` so the same AUT prompt runs unchanged.
  - `serverUrl` — our webhook endpoint.
  - `serverMessages: ["end-of-call-report", "status-update"]` — so we get the result.

  Returns the call `id` as `externalCallId`.
- **`getCall`** — `GET /call/{id}` → map `artifact.transcript`, `status`, and
  `analysis.{summary,successEvaluation}` to `NormalizedCall`. Polling fallback.
- **`verifyWebhook`** — validate the configured `serverUrlSecret` / signature header.
- **`parseWebhookEvent`** — handle `end-of-call-report` (`message.artifact.transcript`,
  `message.endedReason`) and `status-update` (`status: "ended"`). Map to
  `NormalizedCallEvent`.

## Notes

- The transcript arrives as a single string in `artifact.transcript`
  (`"AI: ...\nUser: ..."`); `artifact.messages` is the structured form if we want roles.
- Enable `recordingEnabled` only if we want audio; not needed for scoring.
- WebSocket transport exists for live audio but is unused here.
