import { useState } from "react";
import styled from "styled-components";
import TestCard from "./TestCard";
import TestEditor from "./TestEditor";
import type { Test } from "../../types/suite";
import type { Run } from "../../types/runs";

export default function SuiteList({
	tests,
	latestRunsByTest,
	agentId,
}: {
	tests: Test[];
	latestRunsByTest: Record<string, Run | null>;
	agentId: string;
}) {
	const [editing, setEditing] = useState<Test | null>(null);

	if (tests.length === 0) {
		return <Empty>No tests yet. Try regenerating the suite.</Empty>;
	}

	return (
		<>
			<Grid>
				{tests.map((test) => (
					<TestCard
						key={test.id}
						test={test}
						latestRun={latestRunsByTest[test.id] ?? null}
						agentId={agentId}
						onEdit={() => setEditing(test)}
					/>
				))}
			</Grid>
			{editing && (
				<TestEditor
					test={editing}
					agentId={agentId}
					onClose={() => setEditing(null)}
				/>
			)}
		</>
	);
}

const Grid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
	gap: 16px;
`;

const Empty = styled.p`
	color: #6b7280;
	font-style: italic;
`;
