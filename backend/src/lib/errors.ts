export class BadRequestError extends Error {
	readonly status = 400;
	constructor(message: string) {
		super(message);
		this.name = "BadRequestError";
	}
}

export class NotFoundError extends Error {
	readonly status = 404;
	constructor(resource: string) {
		super(`${resource} not found`);
		this.name = "NotFoundError";
	}
}

export class NotImplementedError extends Error {
	readonly status = 501;
	constructor(what: string) {
		super(`Not implemented: ${what}`);
		this.name = "NotImplementedError";
	}
}

export class LlmParseError extends Error {
	readonly status = 502;
	constructor(detail: string) {
		super(`LLM response did not parse: ${detail}`);
		this.name = "LlmParseError";
	}
}
