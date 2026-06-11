# bl/

Business Logic — orchestrates `dal/`, `providers/`, and `llm/`. Controllers stay thin and
call into here. One subfolder per domain, each with tiny single-purpose files.

- **`agents/`** — register an Agent Under Test from `(name, phone, description)`.
- **`suite/`** — LLM-generate the test suite from the agent description; regenerate; edit
  individual tests.
- **`runs/`** — start a run (place a Dial outbound call against the target's number) and
  ingest the result.
- **`scoring/`** — the LLM judge: score a transcript against the test's criteria.
- **`competitors/`** — (stretch) provision a simulated competitor on ElevenLabs/OpenAI and
  re-run the suite against it for a side-by-side comparison.

Rule: a file does one thing. If it grows a second responsibility, split it.
