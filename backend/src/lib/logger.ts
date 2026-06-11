type Level = "info" | "warn" | "error";

const emit = (level: Level, message: string, fields?: Record<string, unknown>): void => {
	const entry = {
		level,
		message,
		ts: new Date().toISOString(),
		...(fields ?? {}),
	};
	const line = JSON.stringify(entry);
	if (level === "error") {
		console.error(line);
	} else if (level === "warn") {
		console.warn(line);
	} else {
		console.log(line);
	}
};

export const logger = {
	info: (message: string, fields?: Record<string, unknown>) => emit("info", message, fields),
	warn: (message: string, fields?: Record<string, unknown>) => emit("warn", message, fields),
	error: (message: string, fields?: Record<string, unknown>) => emit("error", message, fields),
};
