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

/** Append the voice-style directive to a system prompt. */
export const withVoiceStyle = (prompt: string): string =>
	`${prompt}\n\n${VOICE_STYLE_DIRECTIVE}`;
