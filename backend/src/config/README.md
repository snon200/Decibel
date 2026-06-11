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

# Database
DATABASE_URL=postgres://postgres:postgres@localhost:5432/dial_hackathon

# Dial (tester — places the outbound calls)
DIAL_API_KEY=sk_live_...
DIAL_FROM_NUMBER_ID=...

# ElevenLabs (competitor)
ELEVENLABS_API_KEY=...
ELEVENLABS_AGENT_ID=...
ELEVENLABS_PHONE_NUMBER_ID=...

# VAPI (competitor)
VAPI_API_KEY=...
VAPI_PHONE_NUMBER_ID=...
VAPI_ASSISTANT_ID=...

# OpenAI (suite generation, simulation prompts, judging)
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4o
```

No public URL or webhook secrets are needed: we never receive callbacks. Results are pulled
by polling `getCall`, so the backend can run entirely behind a firewall. Competitor keys are
optional — the comparison feature is skipped if they're absent.
