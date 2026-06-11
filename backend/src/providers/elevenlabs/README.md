# providers/elevenlabs/

Adapter for **ElevenLabs Conversational AI** — a `CompetitorProvider` (stretch).
ElevenLabs is **never on the call critical path**; we use it only to *provision* a
phone-reachable simulated bot. Once provisioned, the competitor is just another phone
number that `providers/dial.placeCall` dials, exactly like the user's bot.

Auth: header `xi-api-key: <ELEVENLABS_API_KEY>`. Base URL: `https://api.elevenlabs.io`.

## What this adapter does

- **`provisionAgent({ systemPrompt, voice?, language? })`** —
  1. `POST /v1/convai/agents` — create a Convai agent with `conversation_config.agent.prompt
     = systemPrompt` (the simulation prompt we generated from the user's agent
     description) plus voice/language settings.
  2. `POST /v1/convai/agents/{agent_id}/phone-numbers` — link a Twilio phone number to the
     agent so it can answer inbound calls. (Phone numbers need to be available in your
     ElevenLabs/Twilio account ahead of time.)
  3. Return `{ externalAgentId: agent_id, phoneNumber }` for storage in the `competitors`
     table.
- **`deleteAgent(externalAgentId)`** — `DELETE /v1/convai/agents/{agent_id}` to clean up.

## Why no `placeCall` / `getCall` / webhook here

In the new model we *don't* call ElevenLabs to place outbound calls. We call **Dial**
outbound *to* the ElevenLabs-managed phone number. The transcript + recording we score
are Dial's, captured through Dial's events — exactly the same path as a user-bot run.
This keeps the judge target-blind and the call lifecycle uniform.
  Returns `conversation_id` as `externalCallId` (response also has `callSid`).
- **`getCall`** — `GET /v1/convai/conversations/{conversation_id}` → map `transcript`
  (array of turns), `status`, and `analysis` to `NormalizedCall`. Polling fallback.
- **`verifyWebhook`** — verify the `elevenlabs-signature` header (`t=…,v0=…`,
  HMAC-SHA256 of `${t}.${rawBody}`, 30-min timestamp tolerance).
- **`parseWebhookEvent`** — handle `post_call_transcription` (full transcript + metadata)
  and map to `NormalizedCallEvent`.
- **`getRecordingUrl`** — no-op (returns null). Recording is only needed on the tester
  (Dial); competitor audio is out of scope.
- **`listNumbers` / `configureInboundNumber`** — list owned numbers and host the
  Agent-Under-Test inbound: assign/patch an agent's prompt on a number, or leave it on
  its default when no prompt is supplied.

## Config

Set in `backend/.env.local`: `ELEVENLABS_API_KEY`, `ELEVENLABS_AGENT_ID`,
`ELEVENLABS_PHONE_NUMBER_ID`, `ELEVENLABS_WEBHOOK_SECRET`.

## Notes

- The agent's first-message + voice may need tuning so the simulation feels comparable to
  the user's bot.
- ElevenLabs's WebSocket API is for live browser/SDK audio — unused here.
- The agent must be created and a phone number linked in the ElevenLabs dashboard (or via
  API) before placing calls — capture `agent_id` + `agent_phone_number_id` in config.
- Outbound injects the AUT prompt per-call via `conversation_initiation_client_data`
  (`conversation_config_override.agent.prompt.prompt`) so the saved agent stays untouched.
- `transcript` is an array of turn objects; flattened to a plain string for the judge.
- ElevenLabs WebSocket API is only for live browser/SDK audio — unused here.
