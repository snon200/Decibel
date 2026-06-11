import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("sanity", () => {
	it("runs synchronous assertions", () => {
		assert.equal(1 + 1, 2);
	});

	it("runs async assertions", async () => {
		const result = await Promise.resolve("ok");
		assert.equal(result, "ok");
	});

	it("throws on failure", () => {
		assert.throws(() => {
			throw new Error("boom");
		}, /boom/);
	});
});
