import styled from "styled-components";

export default function TranscriptViewer({ transcript }: { transcript: string | null }) {
	if (!transcript || transcript.trim().length === 0) {
		return <Empty>No transcript yet.</Empty>;
	}

	const lines = transcript.split(/\r?\n/);
	return (
		<Card>
			{lines.map((line, i) => {
				const speaker = detectSpeaker(line);
				return (
					<Line key={i} $speaker={speaker}>
						{line || " "}
					</Line>
				);
			})}
		</Card>
	);
}

const detectSpeaker = (line: string): "tester" | "aut" | "system" | null => {
	const trimmed = line.trim().toLowerCase();
	if (trimmed.startsWith("tester:") || trimmed.startsWith("caller:") || trimmed.startsWith("user:")) {
		return "tester";
	}
	if (trimmed.startsWith("aut:") || trimmed.startsWith("agent:") || trimmed.startsWith("bot:") || trimmed.startsWith("assistant:")) {
		return "aut";
	}
	if (trimmed.startsWith("system:") || trimmed.startsWith("[")) {
		return "system";
	}
	return null;
};

const Empty = styled.p`
	color: var(--text-dim);
	font-style: italic;
	margin: 0;
`;

const Card = styled.div`
	background: var(--surface);
	border: 1px solid var(--border);
	border-radius: var(--radius);
	padding: 18px 20px;
	font-family: var(--font-mono);
	font-size: 0.85rem;
	line-height: 1.65;
	max-height: 520px;
	overflow-y: auto;
	white-space: pre-wrap;
`;

const speakerColors = {
	tester: "var(--accent-bright)",
	aut: "var(--success)",
	system: "var(--text-dim)",
};

const Line = styled.div<{ $speaker: "tester" | "aut" | "system" | null }>`
	color: ${(p) => (p.$speaker ? speakerColors[p.$speaker] : "var(--text-muted)")};
	font-weight: ${(p) => (p.$speaker ? 500 : 400)};
`;
