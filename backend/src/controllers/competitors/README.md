# controllers/competitors/

Express router for the "test the competitors" flow. Thin — delegates to
`bl/competitors`.

- `POST /agents/:agentId/competitors` — provision a simulated competitor for this agent on
  a chosen platform. Body: `{ platform: 'vapi' | 'elevenlabs' }`. Generates the simulation
  prompt from the agent's description and hosts it on the platform's inbound number.
- `GET /agents/:agentId/competitors` — list provisioned (non-deleted) competitors.
- `GET /agents/:agentId/comparison` — once the agent's suite has been run against the user
  bot and one or more competitors, return a side-by-side scorecard (per-test status +
  per-criterion verdicts + per-side aggregate pass rates).
- `DELETE /competitors/:id` — soft-delete a competitor so it drops out of listings and
  future suite runs (the shared inbound number is left in place).

To actually run the suite against a competitor, use the existing
`POST /agents/:agentId/run-suite` with `{ target: { kind: 'competitor', competitorId } }`.
