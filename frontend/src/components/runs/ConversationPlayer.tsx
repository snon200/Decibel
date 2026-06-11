import { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import type { CorrelatedMessage } from "../../types/runs";
import {
	activeTurnIndex,
	estimateTurnTimings,
	formatTime,
	parseTranscript,
} from "../../utils/transcript";

const SPEEDS = [1, 1.25, 1.5, 2] as const;

type Props = {
	url: string;
	transcript: string;
	durationSeconds: number | null;
	messages?: CorrelatedMessage[] | null;
};

const smsTiming = (m: CorrelatedMessage): string => {
	if (m.secondsFromCallEnd === null) return "during the test";
	if (m.secondsFromCallEnd <= 0) return "during the call";
	const s = m.secondsFromCallEnd;
	if (s < 60) return `${s}s after the call`;
	return `${Math.round(s / 60)}m after the call`;
};

export default function ConversationPlayer({ url, transcript, durationSeconds, messages }: Props) {
	const audioRef = useRef<HTMLAudioElement>(null);
	const scrollRef = useRef<HTMLDivElement>(null);
	const bubbleRefs = useRef<Array<HTMLDivElement | null>>([]);

	const [currentTime, setCurrentTime] = useState(0);
	const [audioDuration, setAudioDuration] = useState(0);
	const [isPlaying, setIsPlaying] = useState(false);
	const [speed, setSpeed] = useState<number>(1);

	const turns = useMemo(() => parseTranscript(transcript ?? ""), [transcript]);
	const effectiveDuration = audioDuration || durationSeconds || 0;
	const timings = useMemo(
		() => estimateTurnTimings(turns, effectiveDuration),
		[turns, effectiveDuration],
	);
	const activeIndex = activeTurnIndex(timings, currentTime);

	useEffect(() => {
		const audio = audioRef.current;
		if (!audio) return;
		const onTime = () => setCurrentTime(audio.currentTime);
		const onMeta = () =>
			setAudioDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
		const onPlay = () => setIsPlaying(true);
		const onPause = () => setIsPlaying(false);
		const onEnded = () => setIsPlaying(false);
		audio.addEventListener("timeupdate", onTime);
		audio.addEventListener("loadedmetadata", onMeta);
		audio.addEventListener("durationchange", onMeta);
		audio.addEventListener("play", onPlay);
		audio.addEventListener("pause", onPause);
		audio.addEventListener("ended", onEnded);
		return () => {
			audio.removeEventListener("timeupdate", onTime);
			audio.removeEventListener("loadedmetadata", onMeta);
			audio.removeEventListener("durationchange", onMeta);
			audio.removeEventListener("play", onPlay);
			audio.removeEventListener("pause", onPause);
			audio.removeEventListener("ended", onEnded);
		};
	}, []);

	useEffect(() => {
		if (audioRef.current) audioRef.current.playbackRate = speed;
	}, [speed]);

	// Follow the conversation while playing — but scroll only *within* the
	// transcript pane. scrollIntoView would bubble up and yank the whole window
	// (and the player controls) off-screen, which feels broken.
	useEffect(() => {
		if (!isPlaying || activeIndex < 0) return;
		const container = scrollRef.current;
		const el = bubbleRefs.current[activeIndex];
		if (!container || !el) return;
		const cRect = container.getBoundingClientRect();
		const eRect = el.getBoundingClientRect();
		const offset =
			eRect.top - cRect.top - (container.clientHeight - el.clientHeight) / 2;
		container.scrollTo({ top: container.scrollTop + offset, behavior: "smooth" });
	}, [activeIndex, isPlaying]);

	const togglePlay = () => {
		const audio = audioRef.current;
		if (!audio) return;
		if (audio.paused) void audio.play();
		else audio.pause();
	};

	const seek = (time: number) => {
		const audio = audioRef.current;
		if (!audio) return;
		const clamped = Math.max(0, Math.min(time, effectiveDuration || audio.duration || 0));
		audio.currentTime = clamped;
		setCurrentTime(clamped);
	};

	const skip = (delta: number) => seek(currentTime + delta);

	const cycleSpeed = () => {
		const idx = SPEEDS.indexOf(speed as (typeof SPEEDS)[number]);
		setSpeed(SPEEDS[(idx + 1) % SPEEDS.length]);
	};

	const progress = effectiveDuration > 0 ? (currentTime / effectiveDuration) * 100 : 0;
	const hasTranscript = turns.length > 0;

	return (
		<Card>
			<audio ref={audioRef} src={url} preload="metadata" />

			<Controls>
				<PlayButton onClick={togglePlay} aria-label={isPlaying ? "Pause" : "Play"}>
					{isPlaying ? <PauseIcon /> : <PlayIcon />}
				</PlayButton>

				<Equalizer $active={isPlaying} aria-hidden>
					{[0, 1, 2, 3].map((i) => (
						<Bar key={i} $i={i} $active={isPlaying} />
					))}
				</Equalizer>

				<Scrubber>
					<Track>
						<Fill style={{ width: `${progress}%` }} />
						<Thumb style={{ left: `${progress}%` }} />
					</Track>
					<RangeInput
						type="range"
						min={0}
						max={effectiveDuration || 0}
						step={0.05}
						value={Math.min(currentTime, effectiveDuration || 0)}
						onChange={(e) => seek(Number(e.target.value))}
						aria-label="Seek"
					/>
				</Scrubber>

				<TimeText>
					{formatTime(currentTime)} / {formatTime(effectiveDuration)}
				</TimeText>

				<IconBtn onClick={() => skip(-10)} aria-label="Back 10 seconds" title="Back 10s">
					−10
				</IconBtn>
				<IconBtn onClick={() => skip(10)} aria-label="Forward 10 seconds" title="Forward 10s">
					+10
				</IconBtn>
				<SpeedBtn onClick={cycleSpeed} title="Playback speed">
					{speed}×
				</SpeedBtn>
			</Controls>

			{hasTranscript ? (
				<Stream ref={scrollRef}>
					{timings.map((turn, i) => {
						const state = i < activeIndex ? "past" : i === activeIndex ? "active" : "future";
						return (
							<Row
								key={i}
								$side={turn.side}
								ref={(el) => {
									bubbleRefs.current[i] = el;
								}}
							>
								{turn.label && <Speaker $side={turn.side}>{turn.label}</Speaker>}
								<Bubble
									$side={turn.side}
									$state={state}
									onClick={() => seek(turn.start + 0.01)}
									title="Jump to this moment"
								>
									<BubbleText dir="auto">{turn.text}</BubbleText>
								</Bubble>
							</Row>
						);
					})}
				</Stream>
			) : (
				<Pending>Transcript will appear here once it’s ready.</Pending>
			)}

			{messages && messages.length > 0 && (
				<SmsSection>
					<SmsHeader>
						<SmsBadge>SMS</SmsBadge>
						{messages.length} text{messages.length > 1 ? "s" : ""} from the agent
					</SmsHeader>
					{messages.map((m) => (
						<SmsBubble key={m.id}>
							<SmsMeta>
								<SmsIcon aria-hidden>✉</SmsIcon>
								{m.from} · {smsTiming(m)}
							</SmsMeta>
							<SmsBody dir="auto">{m.body}</SmsBody>
						</SmsBubble>
					))}
				</SmsSection>
			)}
		</Card>
	);
}

const PlayIcon = () => (
	<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
		<path d="M8 5v14l11-7z" />
	</svg>
);

const PauseIcon = () => (
	<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
		<path d="M6 5h4v14H6zM14 5h4v14h-4z" />
	</svg>
);

const Card = styled.div`
	background: var(--surface);
	border: 1px solid var(--border);
	border-radius: var(--radius);
	overflow: hidden;
	animation: fadeIn 0.3s var(--ease-out);
`;

const Controls = styled.div`
	display: flex;
	align-items: center;
	gap: 14px;
	padding: 16px 18px;
	background: linear-gradient(180deg, var(--surface-2), var(--surface));
	border-bottom: 1px solid var(--border);
`;

const PlayButton = styled.button`
	flex-shrink: 0;
	width: 46px;
	height: 46px;
	border-radius: 50%;
	border: none;
	cursor: pointer;
	display: grid;
	place-items: center;
	color: white;
	background: linear-gradient(135deg, var(--accent-bright), var(--accent));
	box-shadow: 0 6px 18px var(--accent-glow);
	transition: transform 0.15s var(--ease-out), box-shadow 0.2s;
	&:hover {
		transform: scale(1.06);
		box-shadow: 0 8px 26px var(--accent-glow);
	}
	&:active {
		transform: scale(0.96);
	}
`;

const Equalizer = styled.div<{ $active: boolean }>`
	flex-shrink: 0;
	display: flex;
	align-items: flex-end;
	gap: 3px;
	height: 22px;
	width: 26px;
	opacity: ${(p) => (p.$active ? 1 : 0.35)};
	transition: opacity 0.3s;
`;

const Bar = styled.span<{ $i: number; $active: boolean }>`
	flex: 1;
	background: var(--accent-bright);
	border-radius: 2px;
	height: ${(p) => [40, 75, 55, 90][p.$i]}%;
	transform-origin: bottom;
	animation: ${(p) => (p.$active ? "eqBounce 0.9s ease-in-out infinite" : "none")};
	animation-delay: ${(p) => p.$i * 0.12}s;
	@keyframes eqBounce {
		0%, 100% { transform: scaleY(0.4); }
		50% { transform: scaleY(1); }
	}
`;

const Scrubber = styled.div`
	position: relative;
	flex: 1;
	min-width: 80px;
	height: 22px;
	display: flex;
	align-items: center;
`;

const Track = styled.div`
	position: absolute;
	left: 0;
	right: 0;
	height: 6px;
	border-radius: 999px;
	background: var(--border-strong);
	overflow: visible;
`;

const Fill = styled.div`
	height: 100%;
	border-radius: 999px;
	background: linear-gradient(90deg, var(--accent), var(--accent-bright));
	box-shadow: 0 0 12px var(--accent-glow);
`;

const Thumb = styled.div`
	position: absolute;
	top: 50%;
	width: 13px;
	height: 13px;
	border-radius: 50%;
	background: white;
	box-shadow: 0 0 0 3px var(--accent-glow);
	transform: translate(-50%, -50%);
	pointer-events: none;
`;

const RangeInput = styled.input`
	position: absolute;
	left: 0;
	right: 0;
	width: 100%;
	height: 22px;
	margin: 0;
	opacity: 0;
	cursor: pointer;
`;

const TimeText = styled.span`
	flex-shrink: 0;
	font-family: var(--font-mono);
	font-size: 0.78rem;
	color: var(--text-muted);
	font-variant-numeric: tabular-nums;
`;

const IconBtn = styled.button`
	flex-shrink: 0;
	border: 1px solid var(--border-strong);
	background: var(--surface);
	color: var(--text-muted);
	border-radius: var(--radius-sm);
	padding: 5px 8px;
	font-size: 0.72rem;
	font-family: var(--font-mono);
	cursor: pointer;
	transition: all 0.15s;
	&:hover {
		color: var(--text);
		border-color: var(--accent);
	}
`;

const SpeedBtn = styled(IconBtn)`
	min-width: 38px;
	font-weight: 600;
`;

const Stream = styled.div`
	display: flex;
	flex-direction: column;
	gap: 14px;
	padding: 20px 18px;
	max-height: 460px;
	overflow-y: auto;
	scroll-behavior: smooth;
`;

const Row = styled.div<{ $side: "left" | "right" | "center" }>`
	display: flex;
	flex-direction: column;
	gap: 4px;
	align-items: ${(p) =>
		p.$side === "right" ? "flex-end" : p.$side === "center" ? "center" : "flex-start"};
	animation: fadeInUp 0.3s var(--ease-out);
`;

const Speaker = styled.span<{ $side: "left" | "right" | "center" }>`
	font-size: 0.68rem;
	font-weight: 600;
	letter-spacing: 0.06em;
	text-transform: uppercase;
	color: ${(p) => (p.$side === "right" ? "var(--accent-bright)" : "var(--info)")};
	padding: 0 6px;
`;

const Bubble = styled.div<{
	$side: "left" | "right" | "center";
	$state: "past" | "active" | "future";
}>`
	max-width: 78%;
	padding: 10px 14px;
	border-radius: 14px;
	cursor: pointer;
	border: 1px solid transparent;
	transition: background 0.25s, border-color 0.25s, box-shadow 0.25s, transform 0.15s;
	border-bottom-${(p) => (p.$side === "right" ? "right" : "left")}-radius: 4px;

	background: ${(p) =>
		p.$side === "right" ? "rgba(139, 92, 246, 0.10)" : "var(--surface-2)"};

	${(p) =>
		p.$state === "active" &&
		`
		background: ${p.$side === "right" ? "rgba(139, 92, 246, 0.20)" : "var(--bg-elev)"};
		border-color: var(--accent);
		box-shadow: 0 0 0 1px var(--accent), 0 4px 20px var(--accent-glow);
		transform: scale(1.015);
	`}

	${(p) => p.$state === "future" && `opacity: 0.5;`}

	&:hover {
		border-color: var(--border-strong);
	}
`;

const BubbleText = styled.div`
	font-size: 0.9rem;
	line-height: 1.55;
	color: var(--text);
	word-break: break-word;
`;

const Pending = styled.p`
	color: var(--text-dim);
	font-style: italic;
	margin: 0;
	padding: 24px 18px;
`;

const SmsSection = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
	padding: 16px 18px 20px;
	border-top: 1px solid var(--border);
	background: rgba(52, 211, 153, 0.04);
`;

const SmsHeader = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 0.78rem;
	color: var(--text-muted);
`;

const SmsBadge = styled.span`
	font-size: 0.62rem;
	font-weight: 700;
	letter-spacing: 0.08em;
	color: var(--success);
	background: rgba(52, 211, 153, 0.12);
	border: 1px solid rgba(52, 211, 153, 0.35);
	border-radius: 999px;
	padding: 2px 8px;
`;

const SmsBubble = styled.div`
	align-self: flex-start;
	max-width: 78%;
	padding: 10px 14px;
	border-radius: 14px;
	border-bottom-left-radius: 4px;
	background: rgba(52, 211, 153, 0.10);
	border: 1px solid rgba(52, 211, 153, 0.25);
	animation: fadeInUp 0.3s var(--ease-out);
`;

const SmsMeta = styled.div`
	display: flex;
	align-items: center;
	gap: 6px;
	font-size: 0.68rem;
	color: var(--success);
	margin-bottom: 4px;
	font-variant-numeric: tabular-nums;
`;

const SmsIcon = styled.span`
	font-size: 0.8rem;
`;

const SmsBody = styled.div`
	font-size: 0.9rem;
	line-height: 1.5;
	color: var(--text);
	word-break: break-word;
`;
