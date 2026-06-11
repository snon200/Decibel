/**
 * Aggregate per-criterion scores into a single 0..100 run score.
 * Plain arithmetic mean — easy to explain in the dashboard.
 */
export const overallScore = (scores: { score: number }[]): number => {
	if (scores.length === 0) return 0;
	const sum = scores.reduce((acc, s) => acc + s.score, 0);
	return Math.round(sum / scores.length);
};
