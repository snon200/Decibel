# Project: Agent Arena — a voice agent that tests other voice agents

> Built for the Dial Hackathon — **"My Agent Has A Phone"** (June 11–12, 2026, Tel Aviv).

## One-liner

**Give us two things — your bot's phone number and a one-paragraph description of what it
does — and we'll generate a whole test suite, dial your bot for each test, capture the
audio + transcript, and have an LLM judge pass/fail every test against criteria it
derived from your description.** Then, with one click, **run the same suite against a
simulated competitor** (a public bot on ElevenLabs/OpenAI we prompt to mimic your
description) and see how your bot stacks up.

---

## Why

Building a voice agent is easy. Knowing whether it actually *works* on a real call —
handles interruptions, stays on script, recovers from confusion, hits its goal — is hard
and manual. People test by calling their own bot and listening. That doesn't scale, it
doesn't catch regressions, and it doesn't expose the ASR/TTS/latency stack to load.

**Agent Arena turns evaluation into a two-input, one-click, phone-based test.** The user
provides only "what the bot is" and "where to reach it"; we generate the test suite, run
the calls, score the transcripts, and let the user listen to the recordings. Because
everything runs over the actual telephone network via Dial, we test the real thing —
voice, latency, ASR/TTS, the whole stack — not a text simulation.

---

## Core concepts

| Concept | What it is |
| --- | --- |
| **Agent Under Test (AUT)** | The user's voice bot, identified by **(a) its phone number** and **(b) a free-text description** of what it does. We never see its prompt — the description is our only window into what "good" looks like. |
| **Test suite** | A collection of `Test`s automatically generated from the AUT description by an LLM. Each test is one realistic scenario (e.g. *"Customer wants to reschedule an existing booking by an hour"*). The user can review, edit, and re-generate before running. |
| **Test** | One scenario, consisting of a tester-agent `outboundInstruction` (the persona/script the caller plays) **plus** a list of pass/fail criteria specific to that scenario. |
| **Tester Agent** | An AI agent running on **our** Dial number. For each test it places an outbound call to the AUT and plays the test's persona. |
| **Run** | One phone call — `(test, target) → transcript + audio + per-criterion verdicts`. The same test can be run against the user's bot *or* a competitor. |
| **Judge** | An LLM that reads the transcript and scores it against each criterion with a short justification. |
| **Competitor** | A simulated version of the user's bot, built on a public platform (ElevenLabs Conversational AI, OpenAI, etc.) using a system prompt we generate from the AUT description. Lets us answer *"how does your bot compare to a generic agent built on the same idea?"* |

---

## The flow (happy path)

1. **Onboard the agent.** User submits two inputs:
   - **Testing phone line** — the phone number we'll dial when running tests.
   - **Agent description** — one paragraph describing what the bot does, its persona, and
     its key responsibilities (e.g. *"Receptionist for Tony's Pizza. Takes table
     reservations and to-go orders. Knows the menu and hours. Should always confirm name +
     phone before booking."*).
2. **Generate the test suite.** An LLM reads the description and produces 5–10 tests.
   For each: a name, a scenario summary, a generated `outboundInstruction` (the tester's
   persona), and a list of pass/fail criteria specific to that scenario. The user can
   edit any of it or regenerate.
3. **Run a test (or the whole suite).** For each test we place a real phone call from our
   Dial tester number to the AUT. The tester AI agent talks to the user's AI agent.
4. **Capture the result.** When the call ends, Dial emits `call.ended` then
   `call.transcribed`. We fetch the transcript via `GET /api/v1/calls/{id}`. Audio
   recording URL is captured alongside.
5. **Judge it.** The LLM judge scores the transcript against the test's criteria — pass/
   fail + one-sentence justification per criterion, plus an overall %.
6. **Review.** The dashboard shows every run with the transcript, an audio player, and
   the per-criterion scorecard. Listen, read, decide.

### Stretch flow: "Test the competitors"

7. **Spin up a simulated competitor.** From the same agent description we generate a
   system prompt for a public voice-agent platform (primary target: **ElevenLabs
   Conversational AI**, which can answer phone calls out of the box; secondary: any
   competitor with a phone-reachable AI agent). The prompt instructs the public bot to
   behave as if it were the user's bot.
8. **Re-run the same suite against the competitor's number** and show a side-by-side
   scorecard: your bot vs the competitor on identical tests.

```
   user submits ───►  phone number  +  agent description
                                            │
                                            ▼
                              ┌────────────────────────────┐
                              │   LLM test-suite generator  │   (description → 5–10 tests
                              └────────────────────────────┘    each with persona +
                                            │                    criteria)
                                            ▼
                              ┌────────────────────────────┐
   user clicks "Run" ───────► │   Tester Agent (Dial)       │ ──┐ outbound call from our
                              └────────────────────────────┘   │ Dial number, per test
                                                               │
                              user's bot   ◄───── phone ──────┘
                              (any platform, any number)
                                            │
                                            ▼
                              ┌────────────────────────────┐
                              │   Dial events + REST        │   call.ended →
                              │   transcript + audio        │   call.transcribed →
                              └────────────────────────────┘   GET /calls/{id}
                                            │
                                            ▼
                              ┌────────────────────────────┐
                              │   Judge (LLM)               │   pass/fail per criterion
                              └────────────────────────────┘   with justification
                                            │
                                            ▼
                              ┌────────────────────────────┐
                              │   Dashboard (our UI)        │   transcript + audio
                              │                              │   player + scorecard
                              └────────────────────────────┘
                                            │
                                            │  (stretch) re-run same suite
                                            ▼  against a simulated competitor
                              ┌────────────────────────────┐
                              │   Competitor (ElevenLabs/   │   prompt generated from
                              │   OpenAI public bot)        │   the agent description
                              └────────────────────────────┘
```

---

## How it maps to Dial

Everything voice runs on the [Dial API](https://docs.getdial.ai). The tester always lives
on Dial; the AUT lives wherever it lives.

- **Tester = an outbound call from our Dial number.** `POST /api/v1/calls` with
  `to` = AUT phone number, `fromNumberId` = our tester number, `outboundInstruction` =
  generated tester prompt, `language`. Use the `Idempotency-Key` header so retries don't
  double-dial.
  ([Place a voice call](https://docs.getdial.ai/documentation/capabilities/place-a-voice-call))
- **AUT = whatever phone number the user gave us.** Any platform, any provider — we never
  touch it programmatically, we just dial it.
- **Competitor (stretch) = an inbound phone bot on a public platform**, prompted to
  simulate the AUT description. We dial *that* number for the comparison run, using the
  same outbound mechanism.
- **Results = events + call record.** Listen on the account event stream for `call.ended`
  (terminal status, duration) then `call.transcribed` (transcript ready), and fetch the
  call via `GET /api/v1/calls/{id}` for the transcript + audio URL.
  ([Stream account events](https://docs.getdial.ai/documentation/platform/stream-account-events),
  [call.ended](https://docs.getdial.ai/api-reference/events/call-ended),
  [call.transcribed](https://docs.getdial.ai/api-reference/events/call-transcribed))
- **Auth.** `Authorization: Bearer sk_live_...` on every request.
- **SDK / MCP.** Backend uses the `@getdial/sdk` Node client (`dial.makeCall(...)`,
  `dial.getCall(...)`, `dial.newEventsConnection()`). The Claude Code MCP integration is
  for *operating* the system during the demo; production code goes through the SDK.

> The event stream is presence-based (replays only on reconnect within ~2 min), so the
> backend keeps a long-lived listener and also polls `GET /api/v1/calls/{id}` as a
> fallback to guarantee we capture every transcript.

---

## MVP scope (what we commit to)

1. **Two-input onboarding** — register an agent with `{ name, phoneNumber, description }`.
2. **AI-generated test suite** — one LLM call turns the description into a list of tests,
   each with a generated `outboundInstruction` and criteria. User can edit/regenerate.
3. **Run a test (and run the whole suite)** — outbound call per test, live status,
   transcript + audio URL captured.
4. **Scoring** — LLM judge produces per-criterion pass/fail + justification + overall %.
5. **Dashboard** — agents list → agent detail (suite + run history) → run detail
   (transcript + audio player + scorecard). Built from scratch.

## Stretch scope

6. **Simulated competitor** — generate a system prompt from the description, provision
   it on ElevenLabs Conversational AI, expose a phone number, run the same suite against
   it. Side-by-side comparison view.
7. **Multiple competitor platforms** — OpenAI / Retell / VAPI as additional targets.
8. **Suite re-run / regression view** — re-run after the AUT description changes (or
   after the user fixes their bot) and diff scores.
9. **Per-test concurrency control** — run a suite in parallel with caps to stay under
   Dial / competitor rate limits and cost ceilings.

---

## Proposed data model

Tables (Drizzle, in `backend/src/database/schemas/`):

- **`agents`** — `id`, `name`, `phone_number`, `description`, `created_at`.
- **`tests`** — `id`, `agent_id`, `name`, `scenario_summary`, `tester_instruction`
  (generated), `criteria` (jsonb array of `{ id, text }`), `created_at`.
- **`runs`** — `id`, `test_id`, `target_kind` (`user_bot` | `competitor`),
  `target_label` (e.g. `"ElevenLabs Convai"`), `target_phone_number`, `call_id`,
  `status` (`pending` | `dialing` | `in_progress` | `completed` | `failed`),
  `transcript`, `audio_url`, `duration_seconds`, `overall_score`, `created_at`.
- **`scores`** — `id`, `run_id`, `criterion_id`, `passed`, `justification`.
- **`competitors`** (stretch) — `id`, `agent_id`, `platform` (`elevenlabs` | `openai` | …),
  `external_agent_id`, `phone_number`, `simulation_prompt`, `created_at`.

## Proposed backend endpoints

Follows the repo's `controllers / bl / dal` layering.

- `POST /agents` — register `{ name, phoneNumber, description }`. Triggers the test-suite
  generation as the same flow.
- `GET /agents` · `GET /agents/:id` — list / read agents.
- `POST /agents/:id/regenerate-suite` — re-run the LLM generator (replace or version the suite).
- `GET /agents/:id/tests` · `PATCH /tests/:id` — list and edit individual tests.
- `POST /tests/:id/run` — place an outbound call to the AUT, create a `run`.
- `POST /agents/:id/run-suite` — fan out a run per test.
- `GET /runs/:id` — run status + transcript + audio URL + scorecard (frontend polls).
- Internal: Dial event listener updates `runs` on `call.ended` / `call.transcribed` and
  kicks off judging.
- Stretch: `POST /agents/:id/competitors` — generate + provision a competitor;
  `POST /agents/:id/run-suite?target=competitor:<id>` — run the suite against it.

---

## Tech stack

Uses the existing repo skeleton:

- **Frontend** — React + TypeScript + Vite, React Query, styled-components.
- **Backend** — Node + Express + TypeScript, Drizzle ORM, PostgreSQL.
- **Voice** — Dial (`@getdial/sdk`).
- **LLM** — for suite generation, competitor-prompt generation, and judging (provider
  TBD; pluggable through `backend/src/llm/`).
- **Competitors (stretch)** — ElevenLabs Conversational AI (primary), then OpenAI /
  Retell / VAPI.

---

## Judging criteria & how Agent Arena hits them

Full rubric: https://getdial.ai/hackathon/my-agent-has-a-phone/criteria.
Three criteria, 10 points each (30 total), averaged across judges. Scale: 1–3 weak · 4–6 fine · 7–8 strong · 9–10 exceptional.

| # | Criterion | How Agent Arena scores |
| --- | --- | --- |
| 1 | **Real-World Impact & Market Potential** — "would this exist as a company?" | Two inputs and a click is the lowest-friction onboarding any voice-eval tool can offer — works for *every* voice-agent builder (VAPI, ElevenLabs, Retell, custom stack). Pitch: "CI for your voice agent before every deploy." Phone is the *product surface*, not a gimmick. |
| 2 | **Technical Execution & Dial Integration** — "depth over presence" | Dial is the runtime spine: outbound calls (one per test), `call.ended` + `call.transcribed` events, transcript + audio retrieval, plus an LLM judge over the recorded conversation. The competitor stretch adds a *second* phone bot on a different platform that we dial through Dial as well — keeping Dial central even in the comparison flow. |
| 3 | **Innovation & Phone-Native Creativity** — "impressive without the phone?" | An AI tester agent calling another AI agent on a real phone line, with a third AI judging the recording, and a *fourth* AI playing the competitor — strip away the phone and there's no story. The voice/ASR/TTS/latency loop is the entire point of testing voice agents at all. |

Action items the rubric implies:
- Use **multiple Dial capabilities** in the demo (outbound + events + transcripts + recording playback).
- Be ready to **demo live** — the rubric explicitly rewards "working live under demo
  conditions." Keep a known-good AUT + suite ready to run on stage.
- Pitch the **"who pays"** clearly: voice-agent teams running CI against their bots before
  deploys.

## Open questions / risks

- **Audio recording availability.** We need a recording URL per call for the dashboard
  player. Confirm Dial exposes one via the call record or event payload; if not, fall
  back to TTS-rendering the transcript or skip the player for the MVP.
- **Suite generation quality.** The whole UX depends on the LLM producing useful tests
  from a single paragraph. We may need a short rubric / few-shot prompt and a "regenerate"
  affordance to recover when output is weak.
- **Judging reliability.** Criteria must be concrete enough for an LLM judge to score
  consistently. Force structured JSON output, validate with Zod, retry on parse failure.
- **Two AI agents on one call.** Confirm call quality and that the tester reliably drives
  the conversation and hangs up when done — this is the biggest "does it actually work"
  risk.
- **Competitor parity.** Provisioning a phone-reachable bot on ElevenLabs / OpenAI on the
  fly is non-trivial; this is the stretch's main complexity. Start with one platform.
- **Cost & rate limits.** Real calls cost money and have limits; cap concurrency and add a
  per-agent run cap.

---

## References

- **Hackathon home base** — https://getdial.ai/hackathon/my-agent-has-a-phone
  (schedule, submission, rules, showcase).
- **Judging criteria** — https://getdial.ai/hackathon/my-agent-has-a-phone/criteria
  (3 criteria × 10 pts; impact, technical execution + Dial depth, phone-native innovation).
- **Dial docs** — https://docs.getdial.ai/documentation/get-started/introduction
  (API, SDK, CLI, quickstart). Every docs page has a plain-markdown twin (append `.md`
  to any URL).
- **Dial skills (offline copy)** — [`DIAL_SKILLS.md`](./DIAL_SKILLS.md), snapshotted from
  https://getdial.ai/skills.md — CLI bootstrap, common verbs, REST surface, security rules.
- **Playbooks** — https://github.com/GetDial-AI/playbooks/tree/main — runnable reference
  builds we can crib from:
    - `sms-and-voice/node-express` — closest match to our stack: Node/Express dashboard for
      placing voice calls, sending SMS, streaming inbound events. **Primary reference.**
    - `sms-and-voice/python-fastapi` — same shape, FastAPI version.
    - `self-hosted/openai-node` and `self-hosted/openai-python` — call control via the
      OpenAI SDK with transcript-interrupt handling; useful for the tester-agent loop.
    - `ai-agent/python-langchain` — tool-calling agent with inbox + transcript handling;
      reference for richer agent orchestration if we need it.
- **Support** — if you hit a bug, post in the hackathon `#support` channel; ~10 agents
  monitor it and fix issues proactively.
