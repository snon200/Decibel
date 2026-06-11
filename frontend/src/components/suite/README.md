# components/suite/

UI for the agent's auto-generated **test suite**.

- `SuiteList.tsx` — the agent-detail view of the suite. Renders each test with a
  scenario summary, criteria count, last-run status, and a Run button. Also exposes a
  "Regenerate suite" action that calls `POST /agents/:id/regenerate-suite`.
- `TestCard.tsx` — one test row in the list (status + Run / Edit affordances).
- `TestEditor.tsx` — modal/page for editing a single test: rename, tweak the generated
  `tester_instruction`, add/remove/edit criteria.
- `CriteriaEditor.tsx` — the inline criteria editor used by `TestEditor`.
- `RunSuiteButton.tsx` — fan-out trigger that calls `POST /agents/:id/run-suite`; live
  per-test status updates while runs progress.

No standalone "intent" input — the tests are derived from the agent description on
registration, not authored from scratch.
