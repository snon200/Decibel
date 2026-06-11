const apiBaseUrl = "http://localhost:3000";

const throwIfNotOk = async (response: Response): Promise<void> => {
	if (response.ok) return;

	const body = (await response.json().catch(() => null)) as {
		error?: string;
	} | null;
	throw new Error(
		body?.error ?? `Request failed with status ${response.status}`,
	);
};

export const apiGet = async <T>(path: string): Promise<T> => {
	const response = await fetch(`${apiBaseUrl}${path}`);
	await throwIfNotOk(response);
	return (await response.json()) as T;
};

export const apiPost = async <T>(path: string, body?: unknown): Promise<T> => {
	const response = await fetch(`${apiBaseUrl}${path}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: body === undefined ? undefined : JSON.stringify(body),
	});
	await throwIfNotOk(response);
	// Some endpoints return 204; guard against empty body.
	const text = await response.text();
	return (text ? JSON.parse(text) : undefined) as T;
};

export const apiPatch = async <T>(path: string, body: unknown): Promise<T> => {
	const response = await fetch(`${apiBaseUrl}${path}`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
	await throwIfNotOk(response);
	const text = await response.text();
	return (text ? JSON.parse(text) : undefined) as T;
};

export const apiDelete = async (path: string): Promise<void> => {
	const response = await fetch(`${apiBaseUrl}${path}`, { method: "DELETE" });
	await throwIfNotOk(response);
};
