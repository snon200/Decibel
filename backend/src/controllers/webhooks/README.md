# controllers/webhooks/

Inbound **webhook receivers** — how call results reach us without a WebSocket. Only one
vendor calls us back: **Dial**, because every test run is a Dial outbound call. Competitor
platforms (ElevenLabs / OpenAI) are *dialed*, never the other way around, so they don't
emit webhooks to us.

## Routes

- `POST /webhooks/dial` — Dial `call.ended` / `call.transcribed`.

## What the handler does (4 steps)

1. **Read the raw body** (not re-serialized) — needed for signature verification.
2. **Verify** the signature via `providers/dial.verifyWebhook(raw, headers)`; reject with
   `401` if invalid.
3. **Normalize** via `providers/dial.parseWebhookEvent(...)` → `NormalizedCallEvent`.
4. **Hand off** to `bl/runs/ingestCallResult` and return **`2xx` immediately** (Dial
   retries on non-2xx; processing should be fast/idempotent).

## Requirements

- Mount this route with a **raw body parser**, not `express.json()`, so the HMAC matches.
- **Idempotent**: dedupe on `X-Dial-Event-ID`; the same event may arrive more than once.
- The public base URL for this route (`config.PUBLIC_BASE_URL`) is what we register with
  Dial when subscribing to events.
