import { beforeAll, describe, expect, test } from "bun:test";
import {
	formatDouble,
	formatTimestampLocal,
	formatValueSummary,
} from "../../../../../src/mainview/app/shared/utils/firestore-value-format";

beforeAll(() => {
	process.env.TZ = "Asia/Phnom_Penh";
});

describe("formatValueSummary", () => {
	test("shows scalars as their text", () => {
		expect(formatValueSummary({ type: "null" })).toBe("null");
		expect(formatValueSummary({ type: "boolean", value: false })).toBe("false");
		expect(formatValueSummary({ type: "integer", value: "9007199254740993" })).toBe("9007199254740993");
		expect(formatValueSummary({ type: "string", value: "Dara" })).toBe("Dara");
		expect(formatValueSummary({ type: "reference", value: "users/dara" })).toBe("users/dara");
		expect(formatValueSummary({ type: "geopoint", value: { latitude: 11.55, longitude: 104.92 } })).toBe("11.55, 104.92");
	});

	test("keeps a whole-number double apart from an integer", () => {
		expect(formatValueSummary({ type: "double", value: 2 })).toBe("2.0");
		expect(formatDouble(2.5)).toBe("2.5");
		expect(formatDouble("NaN")).toBe("NaN");
		expect(formatDouble(1e21)).toBe("1e+21");
	});

	test("summarises bytes, vectors, maps and arrays by size", () => {
		expect(formatValueSummary({ type: "bytes", value: "Y2luZGVy" })).toBe("6 bytes");
		expect(formatValueSummary({ type: "bytes", value: "Bw==" })).toBe("1 bytes");
		expect(formatValueSummary({ type: "vector", value: [1, 2, 3] })).toBe("vector(3)");
		expect(formatValueSummary({ type: "array", value: [{ type: "null" }] })).toBe("[1 item]");
		expect(formatValueSummary({ type: "array", value: [] })).toBe("[0 items]");
		expect(formatValueSummary({ type: "map", value: { a: { type: "null" }, b: { type: "null" } } })).toBe("{2 fields}");
	});

	test("shows timestamps in local time", () => {
		expect(formatValueSummary({ type: "timestamp", value: { seconds: 1792634400, nanos: 0 } })).toBe("2026-10-22 09:00:00");
	});
});

describe("timestamp formatting", () => {
	test("adds milliseconds to local time only when there are any", () => {
		expect(formatTimestampLocal({ seconds: 1792634400, nanos: 5_000_000 })).toBe("2026-10-22 09:00:00.005");
	});
});
