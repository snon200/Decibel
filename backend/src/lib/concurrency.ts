export const runWithConcurrency = async <T, R>(
	items: T[],
	limit: number,
	worker: (item: T) => Promise<R>,
): Promise<R[]> => {
	const results: R[] = new Array(items.length);
	let next = 0;
	const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
		while (true) {
			const i = next++;
			if (i >= items.length) return;
			const item = items[i];
			if (item === undefined) return;
			results[i] = await worker(item);
		}
	});
	await Promise.all(runners);
	return results;
};
