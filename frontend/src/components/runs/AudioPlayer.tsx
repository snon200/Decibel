import styled from "styled-components";

export default function AudioPlayer({ url }: { url: string | null }) {
	if (!url) {
		return <Empty>Recording not available for this run.</Empty>;
	}
	return <Player controls preload="metadata" src={url} />;
}

const Empty = styled.p`
	color: #6b7280;
	font-style: italic;
	margin: 0;
`;

const Player = styled.audio`
	width: 100%;
	max-width: 480px;
`;
