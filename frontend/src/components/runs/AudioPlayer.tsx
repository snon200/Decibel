import styled from "styled-components";

export default function AudioPlayer({ url }: { url: string | null }) {
	if (!url) {
		return <Empty>Recording not available for this run.</Empty>;
	}
	return (
		<Card>
			<Player controls preload="metadata" src={url} />
		</Card>
	);
}

const Empty = styled.p`
	color: var(--text-dim);
	font-style: italic;
	margin: 0;
`;

const Card = styled.div`
	background: var(--surface);
	border: 1px solid var(--border);
	border-radius: var(--radius);
	padding: 14px 18px;
`;

const Player = styled.audio`
	width: 100%;
	max-width: 520px;
	color-scheme: dark;
`;
