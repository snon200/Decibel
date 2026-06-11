# providers/

Vendor adapters. **This is the only place vendor APIs are touched.** Two distinct
contracts live here, one per role.

## `CallProvider` — placing outbound calls (always Dial)

Implemented by `dial/`. The MVP only places outbound calls through Dial — to the user's
bot for the primary run, and (in the stretch) to a competitor's phone number for the
comparison run. Same code path either way.

```ts
interface CallProvider {
  placeCall(input: PlaceCallInput): Promise<{ externalCallId: string }>;
  getCall(externalCallId: string): Promise<NormalizedCall>;
  verifyWebhook(raw: string, headers: Headers): boolean;
  parseWebhookEvent(raw: string, headers: Headers): NormalizedCallEvent | null;
}
```

`NormalizedCall` flattens Dial's payload into `{ externalCallId, status, transcript,
audioUrl, durationSeconds }`. The rest of the backend never sees Dial-specific fields.

## `CompetitorProvider` — provisioning a simulated bot (stretch, per platform)

Implemented by `elevenlabs/`, `vapi/`, and any other competitor platform we add.
Different shape — its job is to create a phone-reachable AI agent on the platform from a
generated simulation prompt, and return the phone number we can dial:

```ts
interface CompetitorProvider {
  provisionAgent(input: { systemPrompt: string; voice?: string; language?: string; }):
    Promise<{ externalAgentId: string; phoneNumber: string }>;
  deleteAgent(externalAgentId: string): Promise<void>;
}
```

Competitor providers are **never on the call critical path** — they only set up the
target. The actual call goes through `dial.placeCall`.

## No WebSockets — by design

Every integration is plain HTTP:

1. **Start** the call with `dial.placeCall` (REST `POST`) → returns the call id.
2. **Receive** the result via Dial's webhook (`controllers/webhooks/dial`).
3. **Reconcile** anything missed by polling `dial.getCall` (driven by `jobs/`).

Competitor platforms don't notify us — we just dial their number from Dial. Their
WebSocket APIs are for live browser/SDK audio, which we don't use.

## Files per adapter

```
dial/                    # CallProvider
  README.md
  client.ts              base URL + auth (thin fetch wrapper)
  placeCall.ts           build the request body, POST, return externalCallId
  getCall.ts             GET the call, map to NormalizedCall (polling fallback)
  verifyWebhook.ts       HMAC signature verification
  parseWebhookEvent.ts   map the webhook body to NormalizedCallEvent
  index.ts               assemble and export the CallProvider

<competitor>/            # CompetitorProvider (elevenlabs, openai, vapi, ...)
  README.md
  client.ts              base URL + auth
  provisionAgent.ts      create the agent, attach a phone number, return both
  deleteAgent.ts         tear down
  index.ts               assemble and export the CompetitorProvider
```

Keep each file tiny and single-purpose. Vendor-payload mapping lives next to the call
that produces it, not scattered through business logic.
