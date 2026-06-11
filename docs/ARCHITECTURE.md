# Architecture

How **Agent Arena** is wired. See [`PROJECT.md`](./PROJECT.md) for the product vision.

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
 │  bl/runs   │ ──────────────────────► │  providers/<vendor>  │ ──► vendor REST API
 │ startRun   │   { externalCallId }    │  placeCall()         │
 └────────────┘ ◄────────────────────── └──────────────────────┘
       │  run = "dialing"
       │
       │   ......... call happens on the phone (two AI agents talk) .........
       │
       │  2a. WEBHOOK (preferred)            2b. POLLING (fallback)
       ▼                                     ▼
 ┌──────────────────────────┐         ┌──────────────────────────┐
 │ controllers/webhooks/    │         │ jobs/reconcileRuns       │
 │ verify sig → normalize   │         │ sweep stale runs → GET   │
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

## Provider abstraction

Every vendor adapter under `backend/src/providers/<vendor>/` implements the same shape:

```ts
interface VoiceProvider {
  placeCall(input: PlaceCallInput): Promise<{ externalCallId: string }>;
  getCall(externalCallId: string): Promise<NormalizedCall>;   // polling fallback
  verifyWebhook(raw: string, headers: Headers): boolean;       // HMAC check
  parseWebhookEvent(raw: string, headers: Headers): NormalizedCallEvent | null;
}
```

`NormalizedCall` / `NormalizedCallEvent` flatten each vendor's payload into one internal
shape (`status`, `transcript`, `durationSeconds`, `externalCallId`). The rest of the
backend only ever sees normalized data.

### Per-vendor mapping (all REST, no sockets)

| | Start call | Result webhook | Poll fallback |
|---|---|---|---|
| **Dial** | `POST /api/v1/calls` | `call.ended`, `call.transcribed` | `GET /api/v1/calls/{id}` |
| **VAPI** | `POST /call` (`serverUrl`, `serverMessages`) | `end-of-call-report` | `GET /call/{id}` |
| **ElevenLabs** | `POST /v1/convai/twilio/outbound-call` | `post_call_transcription` | `GET /v1/convai/conversations/{id}` |

## Folder map

```
backend/src/
  config/         env + typed config (API keys, base URLs, public webhook URL)
  providers/      voice platform adapters (Dial / VAPI / ElevenLabs) — the only vendor code
  database/
    schemas/      Drizzle tables: agents, tests, runs, scores, benchmarks
  dal/            data-access helpers, one file per table
  bl/             business logic, one subfolder per domain
    agents/         manage Agents Under Test
    tests/          test definitions + AI tester-prompt generation
    runs/           start a run, ingest the call result
    scoring/        LLM judge: score transcript vs criteria
    benchmarks/     fan a test across providers + compare
  llm/            LLM client + prompt builders (generation & judging)
  jobs/           background pollers (reconcile stale runs) — no sockets, just intervals
  controllers/    Express routers, one subfolder per domain
    webhooks/       inbound webhook receivers for each provider

frontend/src/
  pages/          routed top-level views
  components/      presentational + container components, grouped by domain
  api/            typed HTTP client functions, one file per backend domain
  hooks/          React Query hooks
  types/          shared frontend types
```

## Request flow examples

- **Create an AUT:** `controllers/agents` → `bl/agents` → `dal/agents`. For a Dial agent,
  `bl/agents` also calls `providers/dial` to provision a number + set its
  `inboundInstruction`.
- **Generate a tester:** `controllers/tests` → `bl/tests/generateTesterPrompt` → `llm`.
- **Run a test:** `controllers/runs` → `bl/runs/startRun` → `providers/<vendor>.placeCall`.
- **Capture result:** vendor → `controllers/webhooks/<vendor>` →
  `bl/runs/ingestCallResult` → `bl/scoring/judge` → `dal/scores`.
- **Reconcile a miss:** `jobs/reconcileRuns` → `providers/<vendor>.getCall` →
  `bl/runs/ingestCallResult`.
