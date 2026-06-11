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
						{line || " "}
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
	color: #6b7280;
	font-style: italic;
`;

const Card = styled.div`
	background: #f9fafb;
	border: 1px solid #e5e7eb;
	border-radius: 8px;
	padding: 16px;
	font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
	font-size: 0.85rem;
	line-height: 1.6;
	max-height: 480px;
	overflow-y: auto;
	white-space: pre-wrap;
`;

const speakerColors = {
	tester: "#2563eb",
	aut: "#059669",
	system: "#6b7280",
};

const Line = styled.div<{ $speaker: "tester" | "aut" | "system" | null }>`
	color: ${(p) => (p.$speaker ? speakerColors[p.$speaker] : "#1f2937")};
	font-weight: ${(p) => (p.$speaker ? 500 : 400)};
`;
