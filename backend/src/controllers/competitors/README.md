# controllers/competitors/

Express router for the "test the competitors" stretch flow. Thin — delegates to
`bl/competitors`.

- `POST /agents/:agentId/competitors` — provision a simulated competitor for this agent on
  a chosen platform. Body: `{ platform: 'elevenlabs' | 'openai' | ... }`. Generates the
  simulation prompt from the agent's description and calls the chosen
  `CompetitorProvider.provisionAgent`.
- `GET /agents/:agentId/competitors` — list provisioned competitors for the agent.
- `DELETE /competitors/:id` — tear a competitor down (calls `deleteAgent` on the provider).
- `GET /agents/:agentId/comparison` — once the agent's suite has been run against both
  the user bot and one or more competitors, return a side-by-side scorecard
  (per-test + per-criterion verdicts + aggregate pass rates).
