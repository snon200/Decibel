# dial-sms-mcp

A tiny **Context MCP** server that gives a Dial voice agent one tool: `send_sms`.

Dial voice agents are prompt-only and can't natively send SMS. Attaching this as
a [Context MCP](https://docs.getdial.ai/documentation/platform/context-mcp) makes
`send_sms` callable by the agent **during a call**, so it can text the caller a
confirmation/summary.

## How it works

- Exposes MCP tools over Streamable HTTP at `POST /mcp`:
  - `send_sms({ body, to? })` — text the caller.
  - `send_payment_request({ description, amountUsd?, to? })` — create a Stripe
    (test-mode) Checkout Session and text the payment link to the caller. PCI-safe:
    the agent never handles card numbers. Stripe disallows $0, so the minimum is
    ~$0.50; defaults to $1.00. Requires `STRIPE_API_KEY` (sk_test_...).
- On each call, Dial sends `X-Dial-User-Number` (the caller) and `X-Dial-Agent-Number`
  (your Dial number). Tools default the recipient to the caller and send from
  the number the call is on, via Dial `POST /api/v1/messages`.

### Webhook tools (for non-Dial agents, e.g. ElevenLabs)

Agents on other platforms can't use a Dial Context MCP, so the same actions are
also exposed as plain HTTP webhooks an ElevenLabs server tool can call:

- `POST /tools/sms` — body `{ message, to }`. ElevenLabs doesn't substitute
  system vars in headers, so the recipient rides in the body `to` field, bound to
  `{{system__caller_id}}` via the tool's `dynamic_variable`. (`X-Caller-Id` header
  is also accepted as a fallback.)
- `POST /tools/payment` — body `{ description, amount_usd?, to }`, same binding.
- `GET /sent-log?since=ISO&to=E164` — the **evidence feed**. The backend reads
  this to credit SMS/payment criteria for agents it can't correlate via Dial's
  message log. Every send is recorded here even if real delivery fails (for
  cross-platform tests the caller is our own Dial number, so a real text may loop
  back — the *intent* to text is what the judge scores).

Wire it up by pointing the backend's `SMS_MCP_PUBLIC_URL` at this tunnel; the
ElevenLabs agent-under-test is then auto-configured with `send_sms` /
`send_payment_request` webhook tools on each run.

## Run locally + expose

Requires `ngrok` installed and authed (`ngrok config add-authtoken <token>`).

```bash
cp .env.example .env   # fill in DIAL_API_KEY
npm install
npm run start:tunnel   # starts the MCP server AND ngrok together
```

`start:tunnel` boots the server on `:8787` and opens an ngrok tunnel. Grab the
`https://....ngrok-free.app` URL it prints and use `<url>/mcp` as the Context MCP
url below. Ctrl-C stops both.

Prefer separate terminals? Run `npm run start` and `npm run tunnel` instead.

## Register as a Context MCP

```bash
curl -X POST https://getdial.ai/api/v1/context-mcps \
  -H "Authorization: Bearer $DIAL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "name": "SMS sender", "url": "https://<your-tunnel>/mcp" }'
```

Then add to the number's `inboundInstruction` something like: *"After helping the
caller, send them a short SMS confirmation summarizing what you discussed using
the send_sms tool."*

> The ngrok free URL is **ephemeral** — every restart gives a new URL. When it
> changes, update the registration: `PATCH /api/v1/context-mcps/<id>` with the new `url`.

> Security: the tool trusts `X-Dial-User-Number` for the recipient. Don't expose
> the tunnel URL beyond Dial; for production, authorize per call as described in
> the Context MCP docs.
