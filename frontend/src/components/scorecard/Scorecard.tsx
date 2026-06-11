import styled from "styled-components";
import type { Criterion } from "../../types/suite";
import type { Score } from "../../types/scores";

const scoreColor = (n: number) =>
	n >= 70 ? "var(--success)" : n >= 40 ? "var(--warning)" : "var(--danger)";

export default function Scorecard({
	criteria,
	scores,
	overallScore,
}: {
	criteria: Criterion[];
	scores: Score[];
	overallScore: number | null;
}) {
	if (scores.length === 0 && overallScore === null) {
		return <Empty>Scorecard not ready yet.</Empty>;
	}

	const byCriterion = new Map(scores.map((s) => [s.criterionId, s]));

	return (
		<Card>
			<OverallRow>
				<OverallLabel>Overall</OverallLabel>
				<OverallValue $color={scoreColor(overallScore ?? 0)}>
					{overallScore === null ? "…" : `${overallScore}%`}
				</OverallValue>
			</OverallRow>
			<List>
				{criteria.map((c) => {
					const s = byCriterion.get(c.id);
					return (
						<Row key={c.id}>
							<Main>
								<Text>{c.text}</Text>
								{s && <Justification>{s.justification}</Justification>}
							</Main>
							<Verdict>
								{s ? (
									<>
										<PassFail $passed={s.passed}>
											{s.passed ? "PASS" : "FAIL"}
										</PassFail>
										<ScoreNum $color={scoreColor(s.score)}>{s.score}</ScoreNum>
									</>
								) : (
									<Pending>—</Pending>
								)}
							</Verdict>
						</Row>
					);
				})}
			</List>
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
	padding: 20px;
`;

const OverallRow = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: baseline;
	padding-bottom: 14px;
	margin-bottom: 14px;
	border-bottom: 1px solid var(--border);
`;

const OverallLabel = styled.h3`
	margin: 0;
	font-size: 0.95rem;
	font-weight: 600;
	color: var(--text-muted);
	letter-spacing: 0.04em;
	text-transform: uppercase;
`;

const OverallValue = styled.span<{ $color: string }>`
	font-size: 2rem;
	font-weight: 600;
	color: ${(p) => p.$color};
	letter-spacing: -0.025em;
`;

const List = styled.div`
	display: flex;
	flex-direction: column;
	gap: 14px;
`;

const Row = styled.div`
	display: flex;
	gap: 16px;
	align-items: flex-start;
`;

const Main = styled.div`
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 4px;
`;

const Text = styled.div`
	font-size: 0.95rem;
	color: var(--text);
`;

const Justification = styled.div`
	font-size: 0.82rem;
	color: var(--text-dim);
	font-style: italic;
	line-height: 1.5;
`;

const Verdict = styled.div`
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	min-width: 64px;
	gap: 2px;
`;

const PassFail = styled.span<{ $passed: boolean }>`
	font-size: 0.7rem;
	font-weight: 700;
	letter-spacing: 0.08em;
	color: ${(p) => (p.$passed ? "var(--success)" : "var(--danger)")};
`;

const ScoreNum = styled.span<{ $color: string }>`
	font-size: 0.85rem;
	color: ${(p) => p.$color};
	font-family: var(--font-mono);
`;

const Pending = styled.span`
	color: var(--text-dim);
`;
