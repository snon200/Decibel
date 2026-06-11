# controllers/webhooks/

Inbound **webhook receivers** — how call results reach us without a WebSocket. One route
per provider; vendors POST here when a call ends / a transcript is ready.

## Routes

- `POST /webhooks/dial` — Dial `call.ended` / `call.transcribed`.
- `POST /webhooks/vapi` — VAPI `end-of-call-report` / `status-update`.
- `POST /webhooks/elevenlabs` — ElevenLabs `post_call_transcription` / `call_initiation_failure`.

## Every handler does the same 4 steps

1. **Read the raw body** (not re-serialized) — needed for signature verification.
2. **Verify** the signature via `providers/<vendor>.verifyWebhook(raw, headers)`; reject
   with `401` if invalid.
3. **Normalize** via `providers/<vendor>.parseWebhookEvent(...)` → `NormalizedCallEvent`.
4. **Hand off** to `bl/runs/ingestCallResult` and return **`2xx` immediately** (vendors
   retry on non-2xx; processing should be fast/idempotent).

## Requirements

- Mount these routes with a **raw body parser**, not `express.json()`, so the HMAC matches.
- **Idempotent**: dedupe on the vendor event id; the same event may arrive more than once.
- The public base URL for these routes (`config.PUBLIC_BASE_URL`) is what we register with
  each vendor / pass as `serverUrl`.
