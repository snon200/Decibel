# providers/vapi/

Adapter for **VAPI** — an additional optional `CompetitorProvider` (stretch, secondary).
Same shape as `providers/elevenlabs/`: provisions a phone-reachable simulated bot; never
on the call critical path. Once provisioned, the competitor is just another phone number
that `providers/dial.placeCall` dials.

Auth: `Authorization: Bearer <VAPI_API_KEY>`. Base URL: `https://api.vapi.ai`.

## What this adapter does

- **`provisionAgent({ systemPrompt, voice?, language? })`** —
  1. `POST /assistant` — create a VAPI assistant with the simulation prompt + voice
     settings. Returns `{ id }` as `externalAgentId`.
  2. Acquire / attach a phone number to the assistant via `POST /phone-number` (or
     import a Twilio number) so it can answer inbound calls.
  3. Return `{ externalAgentId, phoneNumber }` for storage in the `competitors` table.
- **`deleteAgent(externalAgentId)`** — `DELETE /assistant/{id}` (and detach the number)
  to clean up.

## Why no `placeCall` / webhook here

We don't dial *through* VAPI. The user-bot suite and the competitor suite both go out
through Dial; VAPI is just where the competitor lives. Keeps the lifecycle uniform.

## Notes

- VAPI supports "transient assistants" passed per call — useful for ad-hoc prompt
  variations, but for a benchmark we want a stable, named assistant the user can inspect.
- WebSocket transport exists for live audio but is unused here.
