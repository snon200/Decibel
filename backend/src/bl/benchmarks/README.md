# bl/benchmarks/

The **"Us vs competitors"** feature: run the *same* test against the *same* AUT prompt
deployed on multiple platforms, then compare.

## Files

- `runBenchmark.ts` — for a given test, fan out one `startRun` per platform
  (`dial`, `vapi`, `elevenlabs`) using the identical AUT prompt and identical tester
  instruction. Group the resulting runs under one `benchmark` row.
- `compareScores.ts` — once all runs finish and are judged, assemble a side-by-side
  scorecard: per-criterion and overall score for each platform.

## Fairness rules

- Same `system_prompt`, same `tester_instruction`, same criteria, same judge across all
  platforms — only the voice platform differs.
- A benchmark completes when all child runs reach a terminal state; partial results are
  shown as they arrive (each run reconciles independently via webhook/polling).
