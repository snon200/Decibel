/**
 * Transcript parsing + timing estimation.
 *
 * Dial/VAPI/ElevenLabs hand us a plain "Speaker: text" transcript with no
 * per-word timestamps. To play the transcript in sync with the recording we
 * estimate each turn's start/end by spreading the call duration across turns,
 * weighted by how much was said (character count). It's an approximation, but
 * it tracks the audio closely enough to feel "live".
 */

export type TurnSide = "left" | "right" | "center";

export interface Turn {
	/** Display label as captured in the transcript, e.g. "Agent" / "User". */
	label: string;
	side: TurnSide;
	text: string;
}

export interface TimedTurn extends Turn {
	/** Seconds from call start (estimated). */
	start: number;
	/** Seconds from call start (estimated). */
	end: number;
}

const SPEAKER_SIDE: Record<string, TurnSide> = {
	agent: "right",
	assistant: "right",
	bot: "right",
	aut: "right",
	user: "left",
	caller: "left",
	tester: "left",
	system: "center",
};

const SPEAKER_PREFIX = /^\s*([A-Za-z][A-Za-z ]*?)\s*:\s*(.*)$/;

const titleCase = (raw: string): string =>
	raw
		.trim()
		.toLowerCase()
		.replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * Parse a "Speaker: text" transcript into turns. Continuation lines (no speaker
 * prefix) fold into the previous turn, and consecutive same-side turns merge
 * into one bubble for a cleaner chat layout.
 */
export const parseTranscript = (transcript: string): Turn[] => {
	const lines = transcript.split(/\r?\n/);
	const turns: Turn[] = [];

	for (const rawLine of lines) {
		const line = rawLine.trim();
		if (!line) continue;

		const match = line.match(SPEAKER_PREFIX);
		const known = match ? SPEAKER_SIDE[match[1].trim().toLowerCase()] : undefined;

		if (match && known) {
			const label = titleCase(match[1]);
			const text = match[2].trim();
			const prev = turns[turns.length - 1];
			if (prev && prev.side === known && prev.label === label) {
				prev.text = `${prev.text} ${text}`.trim();
			} else {
				turns.push({ label, side: known, text });
			}
		} else if (turns.length > 0) {
			const prev = turns[turns.length - 1];
			prev.text = `${prev.text} ${line}`.trim();
		} else {
			turns.push({ label: "", side: "center", text: line });
		}
	}

	return turns.filter((t) => t.text.length > 0);
};

const MIN_TURN_WEIGHT = 12; // floor so very short turns still get airtime

/**
 * Spread `durationSeconds` across turns weighted by text length. Returns turns
 * annotated with estimated start/end times. When duration is unknown the turns
 * still get sequential ordering with zero-length spans (no sync).
 */
export const estimateTurnTimings = (
	turns: Turn[],
	durationSeconds: number,
): TimedTurn[] => {
	if (turns.length === 0) return [];

	const weights = turns.map((t) => Math.max(t.text.length, MIN_TURN_WEIGHT));
	const totalWeight = weights.reduce((sum, w) => sum + w, 0);
	const duration = durationSeconds > 0 ? durationSeconds : 0;

	let cursor = 0;
	return turns.map((turn, i) => {
		const span = duration * (weights[i] / totalWeight);
		const start = cursor;
		const end = i === turns.length - 1 ? duration : cursor + span;
		cursor = end;
		return { ...turn, start, end };
	});
};

/** Index of the turn that should be active at `currentTime`, or -1. */
export const activeTurnIndex = (
	timings: TimedTurn[],
	currentTime: number,
): number => {
	if (timings.length === 0) return -1;
	for (let i = timings.length - 1; i >= 0; i--) {
		if (currentTime >= timings[i].start) return i;
	}
	return 0;
};

export const formatTime = (seconds: number): string => {
	if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
	const total = Math.floor(seconds);
	const m = Math.floor(total / 60);
	const s = total % 60;
	return `${m}:${s.toString().padStart(2, "0")}`;
};
