# llm/

One small wrapper around the LLM provider, used for the two AI tasks in the app:
**generating the tester prompt** and **judging transcripts**. No vendor LLM SDK leaks
outside this folder.

## Files

- `client.ts` — construct the client from `config`; expose a single
  `complete({ system, user, json? })` that returns text or parsed JSON.
- `prompts/` — prompt builders (kept separate from the client so they're easy to tweak).

## Conventions

- When structured output is needed (the judge), request JSON and validate with Zod in the
  caller (`bl/scoring`).
- Keep temperature low for the judge (consistency), higher for tester-prompt generation
  (creativity/variety in personas).
