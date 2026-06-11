import { reconcileRuns } from "./reconcileRuns.ts";
import { logger } from "../lib/logger.ts";

let timer: ReturnType<typeof setInterval> | null = null;

const DEFAULT_INTERVAL_MS = 20_000;

export const startJobs = (input?: { intervalMs?: number }): void => {
	if (timer) return;
	const intervalMs = input?.intervalMs ?? DEFAULT_INTERVAL_MS;

	timer = setInterval(() => {
		void reconcileRuns().catch((err) => {
			logger.error("reconcileRuns crashed", {
				error: err instanceof Error ? err.message : String(err),
			});
		});
	}, intervalMs);
	// Don't keep the process alive solely for this timer.
	timer.unref?.();

	logger.info("jobs started", { intervalMs });
};

export const stopJobs = (): void => {
	if (timer) {
		clearInterval(timer);
		timer = null;
	}
};
