<!--
Source: https://getdial.ai/skills.md
Snapshot date: 2026-06-11
Verbatim copy preserved for offline reference. When in doubt, refetch the live page.
-->

# Dial — Communication Stack for AI Agents

Dial gives AI agents a real phone number, SMS, and WhatsApp address. One API to call, text, and message worldwide.

API base: `https://getdial.ai`

**This page only bootstraps you** — install the CLI, onboard, and install the Dial skill into your agent. After that, the installed skill plus `dial --help` and the full docs are your reference for everything else (sending SMS, placing calls, receiving 2FA codes, the event stream). This page intentionally does **not** duplicate that surface.

---

## Quick Start

### Step 1 — Install the CLI

```bash
curl -fsSL https://getdial.ai/install | bash
```

Installs the `dial` command. Requires Node 22+ and git. **No sudo needed** — if your global npm prefix isn't writable, the installer falls back to a user-local prefix and prints the one `export PATH=…` line to add to your shell profile.

### Step 2 — Check state

```bash
dial doctor --json
```

Read the `nextStep` field to decide what to do:

- `signup` → run **Step 3**
- `onboard` → run **Step 4** (pending OTP is still valid)
- `resend_otp` → run **Step 3** again (pending OTP expired)
- `install_listen` → run **Step 5**
- `ready` → nothing to do

### Step 3 — Sign up

```bash
dial signup you@example.com
```

An OTP is emailed. The verification id is stored locally at `~/.local/share/dial/pending-signup.json`.

### Step 4 — Onboard (verify the OTP)

```bash
dial onboard --code 123456 \
  --inbound-instruction "You are my receptionist. Greet the caller and find out what they need."
```

`--inbound-instruction` is **optional** — it's the system prompt the AI voice agent uses on calls *to* your number. If you omit it when your first number is provisioned, a sensible default greeting is used. It's ignored when signing in to an existing account. Change it any time with `dial number set <number> --inbound-instruction "..."`.

On success, writes your API key to `~/.local/share/dial/auth.json` (mode 0600) and prints a masked fingerprint. The CLI reads the key from that file for subsequent commands — you don't need to copy it.

**Install the Dial skill into your own agent** by adding `--agent <name>` — match it to whichever agent you (the agent reading this) are running in. This gives you durable, on-disk knowledge of the full `dial` surface, so future tasks don't need this page re-fetched:

```bash
dial onboard --code 123456 \
  --inbound-instruction "..." \
  --agent claude-code
```

Supported `--agent` values: `claude-code`, `cursor`, `codex`, `opencode`, `pi`, `openclaw`, `nanoclaw`, `hermes`. For `nanoclaw` only, run the command from inside the NanoClaw project root (its skills are project-scoped). Re-run `dial onboard --agent <name>` after a CLI upgrade to refresh the installed skill.

**Finalize onboarding — but only if `dial onboard` offers it.** Whether to install the background notification listening service is the CLI's decision, not yours; its output tells you which way to go:

- If `dial onboard` **offers** the service — `--json` sets `agentHint.action` to `"ask_user"`, and the human output prints an "ask the user" finalization block — then ask the user the question below before continuing. If the original request was something else (e.g. "call X", "send Y"), briefly pause that task, ask, get an answer, then resume.
- If `dial onboard` reports the service **unavailable** and says it's skipping the offer — `--json` sets `agentHint.action` to `"skip"`; this is normal in sandboxes / containers / CI without launchd or systemd — then **don't ask**. Just continue with the original task; inbound events still work via `dial wait-for`.

When you do ask:
- Call it **"the background notification listening service"**. Don't say plist / daemon / launchd / systemd — that's not how to talk to a non-technical user.
- Explain the trade-off: with it, the agent on this machine learns about inbound SMS (2FA codes, replies) and call-ended events in real time. Without it the agent is send-only — it can place calls and send messages but can't observe anything inbound.
- Use your structured ask-user / clarification tool if you have one; otherwise ask in your regular reply and wait for the answer.

### Step 5 — (Conditional) Install the background notification listening service

Only run this if `dial onboard` offered the service **and** the user answered **yes** in Step 4 (skip it entirely if onboard reported the service unavailable):

```bash
dial listen install
```

This needs a user service supervisor — **launchd** on macOS, **systemd `--user`** on Linux. In sandboxes, containers, or CI without one, `dial onboard` detects this and reports the service as unavailable; **skip this step there**. Inbound events still work without the daemon: `dial wait-for` automatically long-polls the API when the daemon isn't running.

After Steps 4–5, run `dial doctor` again — `nextStep` should be `ready`.

---

## Everything else lives in the installed skill + `dial --help`

Once you've onboarded (and ideally installed the skill with `--agent`), use that — not this page — for day-to-day work. The CLI is the source of truth:

```bash
dial --help              # all commands
dial <command> --help    # flags + usage for one command
```

Every command takes `--json` for machine-readable output. The common verbs:

- **Send an SMS** — `dial message --to +1… --body "…"`
- **Place an AI voice call** — `dial call --to +1… --outbound-instruction "…"`, then `dial call get <id>` once it ends
- **Set a number's inbound behavior** — `dial number set <number> --inbound-instruction "…"`
- **Receive a 2FA code / react to a call ending** — `dial wait-for message.received -f channel=sms` / `dial wait-for call.ended -f callId=<id>`

`dial wait-for` reads from the local listen log when the daemon is running and **transparently long-polls the REST API when it isn't** — same filter semantics either way. A match exits `0`; a timeout or fallback error exits non-zero. Run `dial wait-for --help` for its filter flags.

**Full reference:** https://docs.getdial.ai — every page has a plain-markdown twin (append `.md` to any docs URL). To search capabilities without reading the whole site, grep `https://docs.getdial.ai/llms-full.txt`.

---

## Direct REST (no CLI)

The CLI wraps a REST API; you can call it directly. Authenticate every request with `Authorization: Bearer sk_live_...`. Core endpoints:

- `POST /api/v1/auth/signup`, `POST /api/v1/auth/verify` — sign up / onboard (`inboundInstruction` optional; a default is used if omitted)
- `GET|POST /api/v1/numbers`, `PATCH /api/v1/numbers/{id}` — list / provision (`inboundInstruction` optional) / update a number's `inboundInstruction`
- `POST|GET /api/v1/messages` — send / list SMS
- `POST|GET /api/v1/calls` — place (`outboundInstruction`, `language`) / list calls; `GET /api/v1/calls/{id}` for one
- `POST /api/v1/events/wait` — long-poll for the next matching event

Full schemas, fields, and examples: https://docs.getdial.ai

---

## Security Rules

- Never expose your API key (`sk_live_...`) in client-side code or logs — store it in environment variables / the auth file only.
- All requests must use HTTPS.
- Emergency services (911, crisis lines) are blocked.

---

## Pricing

- **$3/month** per phone number
- **$5 signup credit** — first month free
- Usage billed at standard Twilio rates for calls and messages

---

Full docs: https://docs.getdial.ai
Support: founders@getdial.ai
