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

# ElevenLabs (competitor, stretch)
ELEVENLABS_API_KEY=...
ELEVENLABS_AGENT_PHONE_NUMBER_ID=...

# OpenAI (competitor, stretch)
OPENAI_API_KEY=...

# VAPI (competitor, stretch — optional secondary)
VAPI_API_KEY=...

# LLM (suite generation, simulation prompts, judging)
LLM_API_KEY=...
LLM_MODEL=...
```

`PUBLIC_BASE_URL` is critical: Dial's webhook needs a public HTTPS URL, so in local dev we
run a tunnel and point Dial's webhook at `${PUBLIC_BASE_URL}/webhooks/dial`. **Only Dial
calls us back** — competitor platforms are dialed, not listened to, so they need API
keys but no webhook secret. Competitor keys are optional — the comparison feature is
skipped if they're absent.
