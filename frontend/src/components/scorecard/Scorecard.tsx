import styled from "styled-components";
import {
	CRITERION_KIND_LABELS,
	type Criterion,
	type CriterionKind,
} from "../../types/suite";
import type { Score } from "../../types/scores";

const scoreColor = (n: number) =>
	n >= 70 ? "var(--success)" : n >= 40 ? "var(--warning)" : "var(--danger)";

const KIND_COLORS: Record<
	CriterionKind,
	{ bg: string; fg: string; border: string }
> = {
	transcript: {
		bg: "rgba(139, 92, 246, 0.10)",
		fg: "var(--accent-bright)",
		border: "rgba(139, 92, 246, 0.28)",
	},
	received_sms: {
		bg: "rgba(96, 165, 250, 0.10)",
		fg: "var(--info)",
		border: "rgba(96, 165, 250, 0.28)",
	},
	sms_content: {
		bg: "rgba(52, 211, 153, 0.10)",
		fg: "var(--success)",
		border: "rgba(52, 211, 153, 0.28)",
	},
};

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
					const kind: CriterionKind = c.kind ?? "transcript";
					const colors = KIND_COLORS[kind];
					return (
						<Row key={c.id}>
							<Main>
								<TextRow>
									<KindChip
										$bg={colors.bg}
										$fg={colors.fg}
										$border={colors.border}
									>
										{CRITERION_KIND_LABELS[kind]}
									</KindChip>
									<Text>{c.text}</Text>
								</TextRow>
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

const TextRow = styled.div`
	display: flex;
	align-items: baseline;
	gap: 8px;
	flex-wrap: wrap;
`;

const Text = styled.div`
	font-size: 0.95rem;
	color: var(--text);
	flex: 1;
	min-width: 0;
`;

const KindChip = styled.span<{ $bg: string; $fg: string; $border: string }>`
	display: inline-flex;
	flex-shrink: 0;
	font-size: 0.66rem;
	font-weight: 500;
	letter-spacing: 0.02em;
	background: ${(p) => p.$bg};
	color: ${(p) => p.$fg};
	border: 1px solid ${(p) => p.$border};
	padding: 1px 8px;
	border-radius: 999px;
	text-transform: uppercase;
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
