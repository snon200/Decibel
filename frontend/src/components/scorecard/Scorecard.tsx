import styled from "styled-components";
import type { Criterion } from "../../types/suite";
import type { Score } from "../../types/scores";

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
				<OverallValue $score={overallScore ?? 0}>
					{overallScore === null ? "…" : `${overallScore}%`}
				</OverallValue>
			</OverallRow>
			<List>
				{criteria.map((c) => {
					const score = byCriterion.get(c.id);
					return (
						<CriterionRow key={c.id}>
							<CriterionMain>
								<CriterionText>{c.text}</CriterionText>
								{score && (
									<Justification>{score.justification}</Justification>
								)}
							</CriterionMain>
							<Verdict>
								{score ? (
									<>
										<PassFail $passed={score.passed}>
											{score.passed ? "PASS" : "FAIL"}
										</PassFail>
										<Score>{score.score}</Score>
									</>
								) : (
									<Pending>—</Pending>
								)}
							</Verdict>
						</CriterionRow>
					);
				})}
			</List>
		</Card>
	);
}

const Empty = styled.p`
	color: #6b7280;
	font-style: italic;
`;

const Card = styled.div`
	background: white;
	border: 1px solid #e5e7eb;
	border-radius: 8px;
	padding: 16px;
`;

const OverallRow = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: baseline;
	padding-bottom: 12px;
	margin-bottom: 12px;
	border-bottom: 1px solid #e5e7eb;
`;

const OverallLabel = styled.h3`
	margin: 0;
	font-size: 1rem;
	font-weight: 600;
`;

const OverallValue = styled.span<{ $score: number }>`
	font-size: 1.6rem;
	font-weight: 600;
	color: ${(p) => (p.$score >= 70 ? "#065f46" : p.$score >= 40 ? "#9a3412" : "#991b1b")};
`;

const List = styled.div`
	display: flex;
	flex-direction: column;
	gap: 12px;
`;

const CriterionRow = styled.div`
	display: flex;
	gap: 16px;
	align-items: flex-start;
`;

const CriterionMain = styled.div`
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 4px;
`;

const CriterionText = styled.div`
	font-size: 0.9rem;
	color: #1f2937;
`;

const Justification = styled.div`
	font-size: 0.8rem;
	color: #6b7280;
	font-style: italic;
`;

const Verdict = styled.div`
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	min-width: 70px;
	gap: 2px;
`;

const PassFail = styled.span<{ $passed: boolean }>`
	font-size: 0.75rem;
	font-weight: 700;
	letter-spacing: 0.05em;
	color: ${(p) => (p.$passed ? "#065f46" : "#991b1b")};
`;

const Score = styled.span`
	font-size: 0.85rem;
	color: #4b5563;
`;

const Pending = styled.span`
	color: #9ca3af;
`;
