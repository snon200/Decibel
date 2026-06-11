# providers/elevenlabs/

Adapter for **ElevenLabs** Conversational AI — used by the "Us vs competitors" benchmark.

Auth: header `xi-api-key: <ELEVENLABS_API_KEY>`. Base URL: `https://api.elevenlabs.io`.

## What this adapter does

- **`placeCall`** — `POST /v1/convai/twilio/outbound-call` with:
  - `agent_id` — the ElevenLabs agent (carries the AUT prompt; created/configured up front).
  - `agent_phone_number_id` — the linked Twilio number to call from.
  - `to_number` — destination (the AUT's number), E.164.
  - optional `conversation_initiation_client_data` — override the prompt/first message per
    call so we can inject the same AUT prompt the other platforms use.

  Returns `conversation_id` as `externalCallId` (response also has `callSid`).
- **`getCall`** — `GET /v1/convai/conversations/{conversation_id}` → map `transcript`
  (array of turns), `status`, and `analysis` to `NormalizedCall`. Polling fallback.
- **`verifyWebhook`** — verify the HMAC signature; prefer the official
  `@elevenlabs/elevenlabs-js` `webhooks.constructEvent(rawBody, sigHeader, secret)`
  (30-min timestamp tolerance).
- **`parseWebhookEvent`** — handle `post_call_transcription` (full transcript + analysis)
  and `call_initiation_failure`. Map to `NormalizedCallEvent`.

## Notes

- The agent must be created and a phone number linked in the ElevenLabs dashboard (or via
  API) before placing calls — capture `agent_id` + `agent_phone_number_id` in config/DB.
- `transcript` is an array of turn objects; flatten to a plain string for the judge, keep
  the structured form if useful.
- ElevenLabs WebSocket API is only for live browser/SDK audio — unused here.
