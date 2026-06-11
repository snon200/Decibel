# bl/scoring/

The **judge**: score a finished call's transcript against the test's criteria using an LLM.

## Files

- `buildRubric.ts` — turn the test's `criteria[]` into a structured rubric prompt (each
  criterion → a yes/no question + 0–100 sub-score).
- `judgeTranscript.ts` — call `llm/` with the rubric + transcript; parse a strict JSON
  response into `[{ criterion_id, passed, score, justification }]`; persist via
  `dal/scores`.
- `overallScore.ts` — aggregate per-criterion scores into one run-level number (e.g. mean,
  or % of criteria passed).

## Principles

- Deterministic output shape: force JSON, validate with Zod, retry once on parse failure.
- Every verdict carries a `justification` quoting the transcript so the dashboard can show
  *why* — evidence, not just a number.
- The judge is **target-blind**: it scores a plain transcript without knowing whether the
  call hit the user's bot or a simulated competitor, so the side-by-side comparison stays
  fair.
