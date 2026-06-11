import { reconcileRuns } from "./reconcileRuns.ts";
import { retryFailedJudges } from "./retryFailedJudges.ts";
import { logger } from "../lib/logger.ts";

const RECONCILE_INTERVAL_MS = 20_000;
const RETRY_JUDGE_INTERVAL_MS = 60_000;

const runSafely = async (name: string, fn: () => Promise<void>): Promise<void> => {
	try {
		await fn();
	} catch (err) {
		logger.error(`job ${name} threw`, {
			error: err instanceof Error ? err.message : String(err),
		});
	}
};

export const startJobs = (): void => {
	setInterval(() => {
		void runSafely("reconcileRuns", reconcileRuns);
	}, RECONCILE_INTERVAL_MS);

	setInterval(() => {
		void runSafely("retryFailedJudges", retryFailedJudges);
	}, RETRY_JUDGE_INTERVAL_MS);

	logger.info("background jobs started", {
		reconcileMs: RECONCILE_INTERVAL_MS,
		retryJudgeMs: RETRY_JUDGE_INTERVAL_MS,
	});
};
