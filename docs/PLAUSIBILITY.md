# Plausibility check: Dial vs VAPI vs ElevenLabs

Can we, on each platform: **(1)** use a number bought *on that platform* for **both inbound
and outbound** calls, **(2)** get the **call audio recording** (focus: Dial), and **(3)**
use **toll-free / toll (long-distance/international)** calls?

Researched from each platform's official docs (one agent per platform). Verdicts:
✅ yes · ❌ no · ⚠️ caveat/unclear.

## TL;DR matrix

| Capability | Dial | VAPI | ElevenLabs |
|---|:---:|:---:|:---:|
| Buy a number **natively** on the platform | ✅ | ✅ (free US only) | ❌ (BYO Twilio/Exotel/SIP) |
| Same number does **inbound + outbound** | ✅ | ✅ | ✅ (purchased Twilio #) |
| Retrieve **audio recording** (mp3/wav) | ❌ transcript only | ✅ | ✅ |
| **Toll-free** number | ⚠️ undocumented | ⚠️ no native (import Twilio) | ⚠️ via Twilio (verification) |
| **Toll / international** outbound | ✅ (metered) | ⚠️ paid imported # only | ✅ via Twilio (geo perms) |

## Headline takeaways

- **All three can do inbound + outbound on one number** — the core requirement is met
  everywhere.
- **Dial cannot return the call audio recording — transcript only.** This is the one hard
  gap and it directly hits the "get the recording in Dial" ask. VAPI and ElevenLabs both
  return audio.
- **Only Dial and VAPI sell numbers natively.** ElevenLabs is BYO-Twilio. VAPI's native
  number is free but **US-only, no international, daily limits**.
- **Toll-free is nobody's first-class feature.** Realistically it means buying a verified
  toll-free number on Twilio and importing it (VAPI / ElevenLabs); Dial doesn't document
  toll-free at all.

---

## Dial — [details](bbfcf8a3-9730-4374-bae4-8dba44d03553)

1. **Buy a number — ✅** `POST /api/v1/numbers` (`country` ISO alpha-2, default US;
   `areaCode` US/CA only). First number included with onboarding.
2. **Inbound + outbound on one number — ✅** Inbound auto-answers using the number's
   `inboundInstruction`; outbound is `POST /api/v1/calls` with that number as
   `fromNumberId`. Docs explicitly confirm the same number does both.
3. **Audio recording — ❌ (transcript only).** The `Call` object exposes `transcript` but
   **no** `recording`/`audio`/`url` field; the OpenAPI spec has zero hits for
   audio/recording/mp3/wav, and there's no audio webhook (only `call.ended` + thin
   `call.transcribed`). **This is the main risk.**
4. **Toll-free / toll — ⚠️ / ✅.** Toll-free is undocumented (0 mentions).
   International/long-distance calling **is** supported and metered, but per-call pricing
   isn't finalized ("a stand-in until billing and pricing are defined"; ~$5 signup credit).

> If the project needs Dial call audio, we should raise it in the hackathon `#support`
> channel — it may be undocumented rather than impossible. Otherwise, build scoring on the
> transcript (which Dial does provide).

## VAPI — [details](f510f557-9eab-44e6-897e-e446dd2d1e6a)

1. **Buy a number — ✅ (free US).** `POST /phone-number` with `provider: "vapi"` gives a
   free random US local number (max 10/wallet). Other providers (`twilio`/`vonage`/`telnyx`)
   are **imported**, not bought on VAPI. No native toll-free purchase.
2. **Inbound + outbound on one number — ✅** Attach `assistantId` to the number for inbound;
   pass the same `phoneNumberId` to `POST /call` for outbound.
3. **Audio recording — ✅** Set `artifactPlan.recordingEnabled: true` (format `mp3` or
   `wav;l16`); read `call.artifact.recording` (mono/stereo URLs) from `GET /call/:id` or the
   `end-of-call-report` webhook. (Field names vary across doc/SDK versions; legacy
   `recordingUrl` is deprecated.)
4. **Toll-free / toll — ⚠️.** No native toll-free. **Free VAPI numbers can't make
   international calls and have daily limits**; US domestic works. For international /
   toll-free / scale, import a Twilio/Vonage/Telnyx number (+ that provider's rates, plus
   VAPI's per-minute orchestration fee).

## ElevenLabs — [details](65cce95d-9381-461f-81e5-dd8e70e393fb)

1. **Buy a number — ❌ (bring-your-own).** No real native purchase. You buy on Twilio
   (or Exotel/SIP), then import via `POST /v1/convai/phone-numbers` (`sid` + `token`) →
   get `agent_phone_number_id`. (A managed "Reception by ElevenAgents" tier assigns numbers
   but still through third-party carriers.)
2. **Inbound + outbound on one number — ✅** A *purchased* Twilio number does both
   (inbound via the agent binding; outbound via
   `POST /v1/convai/twilio/outbound-call` with `agent_id` + `agent_phone_number_id` +
   `to_number`). Note: a Twilio *verified caller ID* is outbound-only — must be a real
   purchased number for inbound.
3. **Audio recording — ✅** Pull binary MP3 from
   `GET /v1/convai/conversations/{id}/audio`, or receive the `post_call_audio` webhook
   (`data.full_audio`, base64 MP3). Distinct from Twilio-side recording
   (`call_recording_enabled`).
4. **Toll-free / toll — ⚠️ via Twilio.** ElevenLabs isn't a carrier; toll-free, toll,
   and international all depend on the underlying Twilio number — requires Twilio toll-free
   verification, geo-permissions for international, and a regional API key for non-US
   routing.

---

## Recommendation for the build

- **Primary platform: Dial** (native numbers, inbound+outbound, transcript). Score on the
  **transcript**, and treat call audio as a Dial open question to confirm via support.
- **Benchmark platforms: VAPI** (free US number, fastest to stand up, audio included) and
  **ElevenLabs** (needs a Twilio number wired up first — more setup, audio included).
- **Toll-free / international:** out of scope for the MVP unless required; if needed, route
  through a Twilio number on VAPI or ElevenLabs and budget time for Twilio verification.
