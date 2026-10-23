import { describe, expect, test } from "bun:test";
import { errorMessage } from "../../../../../src/mainview/app/shared/utils/error-message";

describe("errorMessage", () => {
	test("shows the message of an error", () => {
		expect(errorMessage(new Error("127.0.0.1:8080 is already added."))).toBe("127.0.0.1:8080 is already added.");
	});

	test("falls back to a generic message for an empty error or a thrown non-error", () => {
		expect(errorMessage(new Error(""))).toBe("Something went wrong. Try again.");
		expect(errorMessage("failed")).toBe("Something went wrong. Try again.");
		expect(errorMessage(null)).toBe("Something went wrong. Try again.");
	});
});
