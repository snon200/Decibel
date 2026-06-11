# database/schemas/

Drizzle table definitions — one file per table, each re-exported from `index.ts`. After
editing, run `npm run db:generate && npm run db:migrate`.

## Tables to add

- **`agents.ts`** — Agent Under Test.
  `id, name, system_prompt, platform ('dial'|'vapi'|'elevenlabs'), external_ref (jsonb:
  dial number id / vapi assistant / 11labs agent), phone_number, created_at`.
- **`tests.ts`** — a test definition.
  `id, agent_id, name, intent, criteria (jsonb: [{ id, text }]), tester_instruction
  (generated), created_at`.
- **`runs.ts`** — one execution (one call).
  `id, test_id, agent_id, platform, external_call_id, status
  ('pending'|'dialing'|'in_progress'|'completed'|'failed'), transcript, duration_seconds,
  error, created_at, completed_at`.
- **`scores.ts`** — judge output, one row per criterion per run.
  `id, run_id, criterion_id, passed (bool), score (int), justification, created_at`.
- **`benchmarks.ts`** — a comparison of one test across platforms.
  `id, test_id, created_at` plus a join from `runs` (each benchmark fans out into N runs,
  one per platform).

Keep `counter.ts` only until the real tables land, then delete it.

## Conventions

- `external_call_id` stores the vendor's call/conversation id so webhooks and polling can
  find the run.
- Store raw vendor payloads in a `jsonb` column if useful for debugging, but the app reads
  normalized columns.
