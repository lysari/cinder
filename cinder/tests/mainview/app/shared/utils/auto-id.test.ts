import { describe, expect, test } from "bun:test";
import { createAutoId } from "../../../../../src/mainview/app/shared/utils/auto-id";

describe("createAutoId", () => {
	test("creates distinct 20-character ids of letters and digits", () => {
		const ids = Array.from({ length: 50 }, createAutoId);
		for (const id of ids) {
			expect(id).toMatch(/^[A-Za-z0-9]{20}$/);
		}
		expect(new Set(ids).size).toBe(50);
	});
});
