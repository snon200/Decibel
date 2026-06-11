# Project: Agent Arena — a voice agent that tests other voice agents

> Built for the Dial Hackathon — **"My Agent Has A Phone"** (June 11–12, 2026, Tel Aviv).

## One-liner

You describe a voice agent and how it should behave. We spin up an **AI tester agent**
that *calls your agent over a real phone line*, runs through scenarios, and scores how
well it did against criteria you define — all visible in a dashboard. Then we let you run
the **same** agent on competing platforms (VAPI, ElevenLabs) and compare results
head-to-head.

---

## Why

Building a voice agent is easy. Knowing whether it actually *works* on a real call —
handles interruptions, stays on script, recovers from confusion, hits its goal — is hard
and manual. Today people test by calling their own bot and listening. That doesn't scale
and isn't repeatable.

**Agent Arena turns evaluation into a one-click, repeatable, phone-based test.** A tester
agent does the calling, an LLM judge does the scoring, and a dashboard shows the evidence
(transcript + per-criterion verdict). Because everything runs over the actual telephone
network via Dial, we test the real thing — voice, latency, ASR/TTS, the whole stack — not
a text simulation.

---

## Core concepts

| Concept | What it is |
| --- | --- |
| **Agent Under Test (AUT)** | The "main bot" the user is building. A system prompt + a Dial phone number that answers inbound calls (`inboundInstruction`). |
| **Tester Agent** | An AI agent we generate. It *places an outbound call* to the AUT and plays a persona/scenario. Driven by an `outboundInstruction` we synthesize from the test prompt + criteria. |
| **Criteria** | A list of pass/fail (or scored) statements describing success, e.g. *"Confirmed the reservation time"*, *"Never invented a price"*, *"Stayed polite when interrupted"*. |
| **Test Run** | One call: tester → AUT. Produces a transcript, a duration, a status, and — after judging — a per-criterion score. |
| **Judge** | An LLM that reads the transcript and scores it against each criterion, with a short justification. |
| **Benchmark** | The same AUT prompt deployed on multiple platforms (Dial, VAPI, ElevenLabs). Run the same tester against each and compare scores. |

---

## The flow (happy path)

1. **Write your bot.** User writes the AUT system prompt in the dashboard (e.g. *"You are a
   receptionist for Tony's Pizza taking reservations."*).
2. **Generate a tester.** User writes a short test intent + criteria. We use an LLM to
   generate a tester `outboundInstruction` — a persona and a scenario that will probe the
   AUT (e.g. *"You are a customer trying to book a table for 6 at 7pm, then change it to
   8pm. Be a little impatient."*).
3. **Run the test.** We place a real phone call: the tester agent dials the AUT's Dial
   number. The two AI agents talk to each other over the phone.
4. **Capture the result.** When the call ends, Dial emits `call.ended`, then
   `call.transcribed`. We fetch the transcript via `GET /api/v1/calls/{id}`.
5. **Judge it.** The LLM judge scores the transcript against each criterion and returns
   pass/fail + justification + an overall score.
6. **See it in the dashboard.** Live run status, transcript, per-criterion verdicts, and
   historical runs — all built from scratch in our own UI.

### Stretch flow: Us vs. the competitors

7. **Benchmark.** Deploy the *same* AUT prompt as an agent on VAPI and ElevenLabs. Run the
   *same* tester scenario against each. The dashboard shows a side-by-side scorecard:
   Dial vs VAPI vs ElevenLabs on the identical criteria.

```
                       ┌─────────────────────────┐
   user writes  ─────► │   Agent Under Test       │  (Dial number, inboundInstruction)
   AUT prompt          └─────────────────────────┘
                                   ▲
                                   │  real phone call
   user writes        ┌───────────┴─────────────┐
   intent + criteria  │      Tester Agent        │  (outbound call, generated prompt)
        │             └─────────────────────────┘
        ▼                         │
   LLM generates                  │ call.ended → call.transcribed
   tester prompt                  ▼
                       ┌─────────────────────────┐
                       │   Judge (LLM)            │  scores transcript vs criteria
                       └─────────────────────────┘
                                   │
                                   ▼
                       ┌─────────────────────────┐
                       │   Dashboard (our UI)     │  runs, transcripts, scorecards
                       └─────────────────────────┘
```

---

## How it maps to Dial

Everything voice runs on the [Dial API](https://docs.getdial.ai). Key pieces:

- **AUT = an inbound Dial number.** Provision a number and set its `inboundInstruction` to
  the AUT system prompt. Dial answers inbound calls automatically with an AI voice.
  ([Receive a voice call](https://docs.getdial.ai/documentation/capabilities/receive-a-voice-call))
- **Tester = an outbound call.** `POST /api/v1/calls` with `to` = AUT number,
  `fromNumberId` = our tester number, `outboundInstruction` = generated tester prompt,
  `language`. Use the `Idempotency-Key` header so retries don't double-dial.
  ([Place a voice call](https://docs.getdial.ai/documentation/capabilities/place-a-voice-call))
- **Results = events + call record.** Listen on the account event stream for `call.ended`
  (terminal status, duration) then `call.transcribed` (transcript ready), and fetch the
  call via `GET /api/v1/calls/{id}` for the transcript.
  ([Stream account events](https://docs.getdial.ai/documentation/platform/stream-account-events),
  [call.ended](https://docs.getdial.ai/api-reference/events/call-ended),
  [call.transcribed](https://docs.getdial.ai/api-reference/events/call-transcribed))
- **Auth.** `Authorization: Bearer sk_live_...` on every request.
- **SDK.** Backend uses the `@getdial/sdk` Node client (`dial.makeCall(...)`,
  `dial.getCall(...)`, `dial.newEventsConnection()`).

> Note: the event stream is presence-based (replays only if you reconnect within ~2 min),
> so the backend keeps a long-lived listener and also polls `GET /api/v1/calls/{id}` as a
> fallback to guarantee we capture the transcript.

---

## MVP scope (what we commit to)

1. **AUT editor** — create/edit an agent prompt, provision/attach a Dial number, set
   `inboundInstruction`.
2. **Test authoring** — write a test intent + a list of criteria; AI generates the tester
   `outboundInstruction` (editable before running).
3. **Run a test** — trigger the outbound call, track status live, capture transcript.
4. **Scoring** — LLM judge produces per-criterion pass/fail + justification + overall %.
5. **Dashboard** — list of agents, list of runs per agent, run detail (transcript +
   scorecard). Built from scratch.

## Stretch scope

6. **Benchmark / "Us vs competitors"** — deploy the same AUT on VAPI and ElevenLabs, run
   the same tester, show a comparison scorecard.
7. **Test suites** — multiple scenarios per agent, aggregate pass rate.
8. **Regression view** — re-run a suite after a prompt change and diff the scores.

---

## Proposed data model

Tables (Drizzle, in `backend/src/database/schemas/`):

- **`agents`** — `id`, `name`, `system_prompt`, `platform` (`dial` | `vapi` | `elevenlabs`),
  `dial_number_id` / external agent id, `phone_number`, `created_at`.
- **`tests`** — `id`, `agent_id`, `name`, `intent`, `criteria` (jsonb array of
  `{ id, text }`), `tester_instruction` (generated), `created_at`.
- **`runs`** — `id`, `test_id`, `agent_id`, `platform`, `call_id`, `status`
  (`pending` | `dialing` | `in_progress` | `completed` | `failed`), `transcript`,
  `duration_seconds`, `created_at`.
- **`scores`** — `id`, `run_id`, `criterion_id`, `passed`, `score`, `justification`.

## Proposed backend endpoints

Follows the repo's `controllers / bl / dal` layering.

- `POST /agents` · `GET /agents` · `GET /agents/:id` — manage AUTs.
- `POST /tests` — create a test; `POST /tests/:id/generate-tester` — AI-generate the tester prompt.
- `POST /tests/:id/run` — place the outbound call and create a `run`.
- `GET /runs/:id` — run status + transcript + scorecard (frontend polls or subscribes).
- Internal: a Dial event listener that updates `runs` on `call.ended` / `call.transcribed`
  and kicks off judging.
- Stretch: `POST /benchmarks/:testId/run` — fan out the same test across platforms.

---

## Tech stack

Uses the existing repo skeleton:

- **Frontend** — React + TypeScript + Vite, React Query, styled-components.
- **Backend** — Node + Express + TypeScript, Drizzle ORM, PostgreSQL.
- **Voice** — Dial (`@getdial/sdk`).
- **LLM** — for tester-prompt generation and for the judge (provider TBD; pluggable).
- **Competitors (stretch)** — VAPI + ElevenLabs SDKs/APIs.

---

## Open questions / risks

- **Two AI agents on one call.** Need to confirm tester↔AUT call quality and that the
  tester reliably drives the conversation and hangs up when done.
- **Judging reliability.** Criteria must be concrete enough for an LLM judge to score
  consistently; may need a rubric format.
- **Transcript timing.** `call.transcribed` can lag `call.ended`; rely on the event + a
  polling fallback.
- **Competitor parity.** Mapping "the same agent" onto VAPI / ElevenLabs fairly (same
  prompt, comparable voice/latency settings) is the trickiest part of the benchmark.
- **Cost & rate limits.** Real calls cost money and have limits; cap concurrency.

---

## References

- **Hackathon home base** — https://getdial.ai/hackathon/my-agent-has-a-phone
  (schedule, submission, rules, showcase, judging rubric).
- **Dial docs** — https://docs.getdial.ai/documentation/get-started/introduction
  (API, SDK, CLI, quickstart).
- **Playbooks** — https://github.com/GetDial-AI/playbooks
  (runnable reference builds: FastAPI, Node/Express, LangChain, self-hosted).
- **Support** — if you hit a bug, post in the hackathon `#support` channel; ~10 agents
  monitor it and fix issues proactively.
