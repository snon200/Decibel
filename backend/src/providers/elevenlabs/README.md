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

## Notes

- The agent's first-message + voice may need tuning so the simulation feels comparable to
  the user's bot.
- ElevenLabs's WebSocket API is for live browser/SDK audio — unused here.
