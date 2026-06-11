# providers/

Voice-platform adapters. **This is the only place vendor APIs are touched.** Everything
else in the backend talks to providers through one shared interface and never imports a
vendor SDK or hardcodes a vendor URL.

## The contract

Each adapter (`dial/`, `vapi/`, `elevenlabs/`) implements the same `VoiceProvider`
interface and exposes it through `index.ts` as a registry keyed by provider name
(`"dial" | "vapi" | "elevenlabs"`).

```ts
interface VoiceProvider {
  placeCall(input: PlaceCallInput): Promise<{ externalCallId: string }>;
  getCall(externalCallId: string): Promise<NormalizedCall>;
  verifyWebhook(raw: string, headers: Headers): boolean;
  parseWebhookEvent(raw: string, headers: Headers): NormalizedCallEvent | null;
}
```

`types.ts` holds `PlaceCallInput`, `NormalizedCall`, `NormalizedCallEvent`, and the
`VoiceProvider` interface. Normalized types flatten every vendor payload into one internal
shape so the rest of the app is vendor-blind.

## No WebSockets — by design

We never open a socket. Each provider follows the same three-step REST pattern:

1. **Start** the call with a REST `POST` → returns the vendor's call/conversation id.
2. **Receive** the result via a **webhook** (inbound HTTP POST handled in
   `controllers/webhooks/`).
3. **Reconcile** anything missed by **polling** a REST `GET` (driven by `jobs/`).

Vendor WebSocket APIs are only for streaming live audio, which Agent Arena does not do.

## Files per adapter

```
<vendor>/
  README.md            what this vendor needs and any quirks
  client.ts            base URL + auth headers (thin fetch wrapper)
  placeCall.ts         build the request body, POST, return externalCallId
  getCall.ts           GET the call, map to NormalizedCall (polling fallback)
  verifyWebhook.ts     HMAC signature verification
  parseWebhookEvent.ts map the webhook body to NormalizedCallEvent
  index.ts             assemble and export the VoiceProvider
```

Keep each file tiny and single-purpose. Mapping logic (vendor payload → normalized) lives
in `getCall.ts` / `parseWebhookEvent.ts`, not scattered through business logic.
