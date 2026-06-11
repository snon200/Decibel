# llm/prompts/

Prompt builders — pure functions that take structured input and return prompt
strings/messages. No network calls here.

## Files

- `testerPrompt.ts` — `buildTesterPrompt({ autPurpose, intent, criteria })` → a system
  prompt that makes the tester act like a realistic caller exercising the criteria, and
  hang up when done.
- `judgePrompt.ts` — `buildJudgePrompt({ rubric, transcript })` → instructions for the
  judge to emit strict JSON `[{ criterion_id, passed, score, justification }]`.

Keep prompts versioned and readable; they're the highest-leverage knobs in the product.
