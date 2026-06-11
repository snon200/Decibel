# database/schemas/

Drizzle table definitions — one file per table, each re-exported from `index.ts`. After
editing, run `npm run db:generate && npm run db:migrate`.

## Tables to add

- **`agents.ts`** — Agent Under Test.
  `id, name, phone_number, description, created_at`.
- **`tests.ts`** — a single test inside an agent's suite.
  `id, agent_id, name, scenario_summary, tester_instruction (generated),
  criteria (jsonb: [{ id, text }]), created_at`.
- **`runs.ts`** — one execution (one call) of one test against one target.
  `id, test_id, target_kind ('user_bot' | 'competitor'), target_label,
  target_phone_number, external_call_id, status
  ('pending'|'dialing'|'in_progress'|'completed'|'failed'), transcript, audio_url,
  duration_seconds, overall_score, error, created_at, completed_at`.
- **`scores.ts`** — judge output, one row per criterion per run.
  `id, run_id, criterion_id, passed (bool), justification, created_at`.
- **`competitors.ts`** (stretch) — a simulated competitor provisioned on a public
  platform.
  `id, agent_id, platform ('elevenlabs' | 'openai' | ...), external_agent_id,
  phone_number, simulation_prompt, created_at, deleted_at`.

Keep `counter.ts` only until the real tables land, then delete it.

## Conventions

- `external_call_id` stores Dial's call id so the reconcile poller can find the run.
- Store raw vendor payloads in a `jsonb` column if useful for debugging, but the app reads
  normalized columns.
- `target_phone_number` is denormalized onto `runs` so a deleted/edited competitor
  doesn't rewrite history.
