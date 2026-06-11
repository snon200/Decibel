# Architecture

How **Decibel** is wired. See [`PROJECT.md`](./PROJECT.md) for the product vision.

## Guiding principles

- **No WebSockets.** Every integration is plain HTTP: a REST `POST` to start a call, a
  **webhook** (inbound HTTP POST) to learn the result, and a **REST `GET` poll** as a
  fallback. WebSockets in these platforms exist only for live audio streaming, which we
  don't need — we orchestrate calls and read transcripts *after* they finish.
- **Small files, one concern each.** Every folder owns a single responsibility and holds
  a `README.md` saying exactly what lives there.
- **Provider-agnostic core.** All voice platforms hide behind one `VoiceProvider`
  interface. The business logic never imports a vendor SDK directly.

## The no-WebSocket call lifecycle

```
 ┌────────────┐   1. POST start call    ┌──────────────────────┐
 │  bl/runs   │ ──────────────────────► │   providers/dial     │ ──► POST /api/v1/calls
 │ startRun   │   { externalCallId }    │   placeCall()        │
 └────────────┘ ◄────────────────────── └──────────────────────┘
       │  run = "dialing"
       │
       │   ......... call happens on the phone (two AI agents talk) .........
       │
       │  2a. WEBHOOK (preferred)            2b. POLLING (fallback)
       ▼                                     ▼
 ┌──────────────────────────┐         ┌──────────────────────────┐
 │ controllers/webhooks/    │         │ jobs/reconcileRuns       │
 │ dial — verify sig →      │         │ sweep stale runs →       │
 │ normalize event          │         │ providers/dial.getCall   │
 └──────────────────────────┘         └──────────────────────────┘
       │                                     │
       └──────────────┬──────────────────────┘
                      ▼
            ┌────────────────────┐   3. transcript ready
            │ bl/runs            │ ─────────────────────────►  bl/scoring/judge
            │ ingestCallResult   │                              (LLM scores transcript
            └────────────────────┘                               vs criteria)
                      │
                      ▼
            run = "completed" + scores persisted → dashboard reads them
```

**Why both webhook *and* polling?** Webhooks are at-least-once but require a public HTTPS
URL and can be missed if our server is briefly down. Polling guarantees we eventually
reconcile every run. The webhook makes it fast; the poller makes it reliable.

## Two provider interfaces

The product has **one outbound-call mechanism** (Dial) and **N optional competitor
platforms** (ElevenLabs, OpenAI, etc.). Don't conflate them — they serve different
concerns and have different shapes.

### `CallProvider` — placing outbound calls

Only `providers/dial` implements this. Every test run dials *some* phone number from our
Dial tester number — whether the number belongs to the user's bot or to a competitor we
provisioned, the call mechanism is the same.

```ts
interface CallProvider {
  placeCall(input: PlaceCallInput): Promise<{ externalCallId: string }>;
  getCall(externalCallId: string): Promise<NormalizedCall>;   // polling fallback
  verifyWebhook(raw: string, headers: Headers): boolean;       // HMAC check
  parseWebhookEvent(raw: string, headers: Headers): NormalizedCallEvent | null;
}

interface NormalizedCall {
  externalCallId: string;
  status: "in_progress" | "completed" | "failed";
  transcript: TranscriptTurn[] | null;
  audioUrl: string | null;
  durationSeconds: number | null;
}
```

`audioUrl` is what the dashboard's recording player loads. `NormalizedCallEvent` is the
same shape but partial — webhook events may carry only a status change without the
transcript yet.

### `CompetitorProvider` — provisioning a phone-reachable simulated bot (stretch)

One adapter per competitor platform under `providers/<vendor>/`. Different shape — its
job is to create an agent and surface a phone number we can dial:

```ts
interface CompetitorProvider {
  provisionAgent(input: {
    systemPrompt: string;    // generated from the AUT description
    voice?: string;
    language?: string;
  }): Promise<{ externalAgentId: string; phoneNumber: string }>;

  deleteAgent(externalAgentId: string): Promise<void>;
}
```

Once provisioned, a competitor is just another phone number in the `competitors` table.
The run path goes through `CallProvider.placeCall` → that number, *exactly* like a user-
bot run. The competitor adapter is **never on the critical call path**.

### Per-vendor mapping

| Vendor | Role | Endpoint(s) | Webhook / event |
|---|---|---|---|
| **Dial** | `CallProvider` (always) | `POST /api/v1/calls`, `GET /api/v1/calls/{id}` | `call.ended`, `call.transcribed` |
| **ElevenLabs** | `CompetitorProvider` (stretch, primary) | `POST /v1/convai/agents`, `POST /v1/convai/agents/{id}/phone-numbers` | — (we don't listen to it; we just dial its number from Dial) |
| **OpenAI** | `CompetitorProvider` (stretch, secondary) | Realtime API + Twilio bridge | — |

## Folder map

```
backend/src/
  config/         env + typed config (API keys, base URLs, public webhook URL)
  providers/
    dial/         CallProvider — outbound calls, events, transcripts (always on the path)
    elevenlabs/   CompetitorProvider — provision a phone-reachable convai agent (stretch)
    openai/       CompetitorProvider — provision via Realtime + bridge (stretch)
  database/
    schemas/      Drizzle tables: agents, tests, runs, scores, competitors
  dal/            data-access helpers, one file per table
  bl/             business logic, one subfolder per domain
    agents/         register an agent (phone + description)
    suite/          LLM-generate the test suite from the description; regenerate; edit
                    individual tests (renamed from bl/tests/)
    runs/           start a run (per test, per target), ingest the call result
    scoring/        LLM judge: score transcript vs criteria
    competitors/    provision a simulated competitor on a public platform (stretch;
                    renamed from bl/benchmarks/)
  llm/            LLM client + prompt builders (suite generation, simulation prompts, judging)
  jobs/           background pollers (reconcile stale runs) — no sockets, just intervals
  controllers/    Express routers, one subfolder per domain
    agents/         register agent endpoints
    suite/          test/suite endpoints (renamed from controllers/tests/)
    runs/           start-a-run + read-run endpoints
    competitors/    provision/list/teardown competitors (renamed from controllers/benchmarks/)
    webhooks/       inbound webhook receivers (Dial only — competitors don't call us back)

frontend/src/
  pages/          routed top-level views
  components/      presentational + container components, grouped by domain
    agents/         agent list, registration form (phone + description)
    suite/          test suite list, test editor, run-suite button
    runs/           run-detail UI: status, transcript, audio player, target summary
    scorecard/      per-criterion verdict rendering
    comparison/     user-bot vs competitor side-by-side (renamed from components/benchmark/)
  api/            typed HTTP client functions, one file per backend domain
  hooks/          React Query hooks
  types/          shared frontend types
```

## Request flow examples

- **Register an agent + generate the suite:** `controllers/agents.POST` →
  `bl/agents.create` (persists `{ name, phoneNumber, description }`) →
  `bl/suite.generateFromDescription` → `llm` → `dal/tests` (writes one row per generated
  test). Returns the agent and its initial suite in one response.
- **Regenerate / edit a suite:** `controllers/agents.regenerateSuite` →
  `bl/suite.generateFromDescription`; `PATCH /tests/:id` → `dal/tests` for hand edits.
- **Run a test:** `controllers/runs.start` → `bl/runs.startRun` →
  `providers/dial.placeCall` to the target phone number (user-bot *or* competitor).
- **Capture result:** Dial webhook → `controllers/webhooks/dial` →
  `bl/runs.ingestCallResult` (writes transcript + `audioUrl` + `durationSeconds`) →
  `bl/scoring.judgeRun` → `dal/scores`.
- **Reconcile a miss:** `jobs/reconcileRuns` → `providers/dial.getCall` →
  `bl/runs.ingestCallResult`.
- **Provision a competitor (stretch):** `controllers/competitors.create` →
  `bl/competitors.provision` → `llm.buildSimulationPrompt` →
  `providers/<elevenlabs|openai>.provisionAgent` → `dal/competitors` (stores the phone
  number alongside the agent). Subsequent runs against this competitor go through the
  normal run path — `bl/runs.startRun` just gets a different `target_phone_number`.

## Reference implementations

Lift wiring straight from the Dial playbooks repo
(https://github.com/GetDial-AI/playbooks/tree/main) — don't reinvent.

| Concern | Playbook to mirror |
| --- | --- |
| Dashboard + REST shell for outbound calls / SMS / events (Node) | `sms-and-voice/node-express` — same stack as us; the canonical starting point for `providers/dial` + `controllers/webhooks/dial`. |
| Inbound webhook signature verification and event normalization | `sms-and-voice/node-express` (the webhook handler) + `sms-and-voice/python-fastapi` for cross-checking payload shapes. |
| Tester-agent loop with transcript interrupts (the tester needs to react mid-call and hang up cleanly) | `self-hosted/openai-node` — call-control over the dial-sdk protocol focused on transcript-interrupt handling. |
| Richer agent orchestration / tool-calling if the tester needs structured actions | `ai-agent/python-langchain` — tool-calling agent with inbox + transcript handling. |

Judging-criteria implication for the architecture
(https://getdial.ai/hackathon/my-agent-has-a-phone/criteria, criterion 2 — *technical
execution & Dial depth*): keep `providers/dial` thick and surface **multiple Dial
capabilities** in the demo — outbound calls, `call.ended` + `call.transcribed` events,
transcript retrieval, and audio recording playback. Use real webhooks for the primary
path so the demo feels live; polling stays as the reliability backstop, not the headline
mechanism. The competitor flow is intentionally *also* a Dial outbound call (to the
competitor's number), so the comparison view keeps Dial central.
