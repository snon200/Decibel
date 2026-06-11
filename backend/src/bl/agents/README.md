# bl/agents/

Manage **Agents Under Test (AUT)**.

## Files

- `createAgent.ts` — persist the agent, then bind it to its platform:
  - **dial** — `providers/dial` purchases a number (or attaches an existing one) and sets
    `inboundInstruction` to the agent's `system_prompt`; store the number id + phone in
    `external_ref`.
  - **vapi** — store the prompt as a transient-assistant config (no provisioning needed at
    create time; the prompt is sent per call).
  - **elevenlabs** — reference an existing `agent_id` + `agent_phone_number_id`.
- `updateAgentPrompt.ts` — update `system_prompt` and propagate (e.g. re-`PATCH` the Dial
  number's `inboundInstruction`).
- `getAgent.ts` / `listAgents.ts` — read helpers.

The AUT's phone number is what the tester dials.
