# bl/competitors/

The **"test the competitors"** feature (stretch). Given an agent's description, spin up a
*simulated competitor* on a public platform (ElevenLabs Conversational AI, OpenAI, …)
that mimics the user's bot, then re-run the agent's existing suite against the
competitor's phone number for a side-by-side comparison.

## Files

- `buildSimulationPrompt.ts` — `llm/` call that turns the user's agent description into a
  system prompt the competitor will run with (e.g. *"You are an AI assistant. Behave as
  faithfully as possible like this bot: <description>."*).
- `provisionCompetitor.ts` — call the chosen `providers/<elevenlabs|openai>.provisionAgent`
  with the simulation prompt. Persist `{ agent_id, platform, external_agent_id,
  phone_number, simulation_prompt }` in the `competitors` table.
- `runSuiteAgainstCompetitor.ts` — fan out the agent's existing tests as runs targeting
  the competitor's phone number (`target_kind = 'competitor'`, `target_label =
  'ElevenLabs Convai'`, etc.). Runs go through the normal `bl/runs.startRun` path — the
  competitor isn't on the call critical path, just on the dialing destination.
- `compareScores.ts` — once both the user-bot suite and the competitor suite have finished,
  assemble a side-by-side scorecard: per-test pass/fail + per-criterion verdict for each
  target, plus aggregate pass rates.

## Fairness rules

- **Same suite** — identical `tester_instruction` + criteria for both runs. The judge
  doesn't know which side it's scoring.
- **Same judge prompt** — scoring is target-blind.
- A comparison view becomes meaningful once all child runs (both sides) reach a terminal
  state; partial results stream in as they arrive.

## Out of scope

Provisioning a competitor on a platform we don't yet support — adding one means writing a
new `CompetitorProvider` adapter, not changing this folder.
