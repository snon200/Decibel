# bl/competitors/

The **"test the competitors"** feature. Given an agent's description, host a
*simulated competitor* on a competitor platform's inbound number (VAPI or ElevenLabs)
that mimics the user's bot, then re-run the agent's existing suite against the
competitor's phone number for a side-by-side comparison. Dial stays reserved for the
tester (the AI caller), so it is not a competitor platform.

## Files

- `buildSimulationPrompt.ts` — `llm/` call that turns the user's agent name + description
  into a complete inbound system prompt the competitor answers with, so it behaves like
  the user's Agent-Under-Test on a real phone call.
- `provisionCompetitor.ts` — build the simulation prompt, host it on the platform's inbound
  number via `bl/agents.hostInboundAgent` (which drives `providers/<vapi|elevenlabs>.
  configureInboundNumber`), then persist `{ agent_id, platform, external_agent_id,
  phone_number, simulation_prompt }` in the `competitors` table. The platform number id
  comes from `*_PHONE_NUMBER_ID` config, falling back to the platform's first listed number.
- `compareScores.ts` — assemble a side-by-side scorecard from the latest user-bot run vs the
  latest competitor run per test: per-test status + per-criterion verdicts for each target,
  plus per-side aggregates (avg overall score + criteria pass rate).
- `index.ts` — re-exports `provisionCompetitor` / `compareScores` and exposes
  `listCompetitors` + `teardownCompetitor` (soft delete).

Running the suite against a competitor reuses the normal run path: `bl/runs.runSuite` with
`target = { kind: 'competitor', competitorId }` (exposed via `POST /agents/:id/run-suite`).
There is no separate competitor-run module — the competitor is only the dialing destination,
never on the call critical path.

## Fairness rules

- **Same suite** — identical `tester_instruction` + criteria for both runs. The judge
  doesn't know which side it's scoring.
- **Same judge prompt** — scoring is target-blind.
- A comparison view becomes meaningful once all child runs (both sides) reach a terminal
  state; partial results stream in as they arrive.

## Out of scope

Provisioning a competitor on a platform we don't yet support — adding one means writing a
new `CompetitorProvider` adapter, not changing this folder.
