# config/

Typed, validated configuration. Read environment variables **once** here, validate with
Zod, and export a frozen `config` object. Nothing else in the backend reads
`process.env` directly.

## What lives here

- `env.ts` — load + validate env vars, export `config`.

## Expected env vars

```
# Server
PORT=3000
PUBLIC_BASE_URL=https://<tunnel>.ngrok.app   # where vendors POST webhooks

# Database
DATABASE_URL=postgres://postgres:postgres@localhost:5432/dial_hackathon

# Dial
DIAL_API_KEY=sk_live_...
DIAL_WEBHOOK_SECRET=whsec_...

# VAPI (benchmark)
VAPI_API_KEY=...
VAPI_PHONE_NUMBER_ID=...
VAPI_WEBHOOK_SECRET=...

# ElevenLabs (benchmark)
ELEVENLABS_API_KEY=...
ELEVENLABS_AGENT_PHONE_NUMBER_ID=...
ELEVENLABS_WEBHOOK_SECRET=...

# LLM (tester-prompt generation + judging)
LLM_API_KEY=...
LLM_MODEL=...
```

`PUBLIC_BASE_URL` is critical: webhooks need a public HTTPS URL, so in local dev we run a
tunnel and point every vendor's webhook/`serverUrl` at `${PUBLIC_BASE_URL}/webhooks/<vendor>`.
Competitor keys are optional — the benchmark feature is skipped if they're absent.
