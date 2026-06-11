# bl/

Business Logic — orchestrates `dal/`, `providers/`, and `llm/`. Controllers stay thin and
call into here. One subfolder per domain, each with tiny single-purpose files.

- **`agents/`** — create/update an Agent Under Test; for Dial, provision the number and set
  its inbound instruction via the provider.
- **`tests/`** — create test definitions and AI-generate the tester prompt.
- **`runs/`** — start a run (place the call) and ingest the result.
- **`scoring/`** — the LLM judge: score a transcript against criteria.
- **`benchmarks/`** — fan a test across providers and compare results.

Rule: a file does one thing. If it grows a second responsibility, split it.
