/**
 * E.164 helpers. Backend mirrors these rules in
 * `backend/src/controllers/agents/index.ts` so the same input is accepted
 * on both ends.
 */

export const E164_REGEX = /^\+[1-9]\d{1,14}$/;

// Strip whitespace, invisible bidi marks, parens, dashes, dots —
// keep only `+` and digits.
export const normalizePhone = (raw: string): string => raw.replace(/[^\d+]/g, "");

export const isValidE164 = (raw: string): boolean =>
	E164_REGEX.test(normalizePhone(raw));
