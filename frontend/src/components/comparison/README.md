# components/comparison/

UI for **"test the competitors"** — side-by-side scorecard of the user's bot vs one or
more simulated competitors on the *same* test suite.

- `TargetColumn.tsx` — one target's results (user-bot or a specific competitor): per-test
  pass/fail and aggregate pass rate.
- `ComparisonTable.tsx` — full grid: rows = tests, columns = targets, cells = pass/fail +
  per-criterion drilldown.
- `ProvisionCompetitorDialog.tsx` — pick a platform (`ElevenLabs` / `OpenAI` / ...) to
  provision a simulated competitor for this agent; calls
  `POST /agents/:id/competitors`.
- `CompetitorList.tsx` — provisioned competitors for an agent, with tear-down.
