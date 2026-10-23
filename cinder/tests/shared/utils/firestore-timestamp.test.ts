import { describe, expect, test } from "bun:test";
import { formatTimestampUtc } from "../../../src/shared/utils/firestore-timestamp";

describe("formatTimestampUtc", () => {
	test("writes UTC with as many fraction digits as needed", () => {
		expect(formatTimestampUtc({ seconds: 1792634400, nanos: 0 })).toBe("2026-10-22T02:00:00Z");
		expect(formatTimestampUtc({ seconds: 1792634400, nanos: 120_000_000 })).toBe("2026-10-22T02:00:00.120Z");
		expect(formatTimestampUtc({ seconds: 1792634400, nanos: 123_456_000 })).toBe("2026-10-22T02:00:00.123456Z");
		expect(formatTimestampUtc({ seconds: 1792634400, nanos: 123_456_789 })).toBe("2026-10-22T02:00:00.123456789Z");
		expect(formatTimestampUtc({ seconds: -62135596800, nanos: 0 })).toBe("0001-01-01T00:00:00Z");
	});
});
