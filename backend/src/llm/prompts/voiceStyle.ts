/**
 * Shared voice-call style directive. Appended to every prompt that drives a
 * live phone agent (the tester caller, and — via the Dial API — the inbound
 * agent) so replies sound like a real spoken conversation, not a read-out list.
 */
export const VOICE_STYLE_DIRECTIVE = `VOICE STYLE (always follow): You are on a live phone call, so talk like a real person — not a document.
- Keep every reply to one or two short sentences.
- Use casual, natural, spoken language and contractions.
- Never read out lists, bullet points, or long explanations. If there are options, say just one or two and ask a quick follow-up.
- Say one thing at a time and let the other person respond — don't monologue.`;

/**
 * Demo-pacing directive. Appended after the voice style so every test stays
 * short enough to be watchable in a demo video. Not surfaced in the UI — it's
 * applied at call time only.
 */
export const CALL_PACING_DIRECTIVE = `CALL PACING (always follow): This call is for a quick demo, so keep it short.
- Total call length should be about 1 to 2 minutes — no longer.
- Get to the point on your first or second turn. Don't make small talk.
- As soon as you've achieved the goal of the scenario (or it's clearly stalled), wrap up in one short sentence and hang up.
- If the bot is being slow, repetitive, or going in circles, end the call early rather than dragging it on.`;

/** Append the voice-style + pacing directives to a system prompt. */
export const withVoiceStyle = (prompt: string): string =>
	`${prompt}\n\n${VOICE_STYLE_DIRECTIVE}\n\n${CALL_PACING_DIRECTIVE}`;
