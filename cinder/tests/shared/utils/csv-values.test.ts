import { describe, expect, test } from "bun:test";
import { flattenFieldsForCsv, inferCsvColumnType, isSupportedTimeZone, parseCsvCell, parseCsvTimestamp } from "../../../src/shared/utils/csv-values";

describe("inferCsvColumnType", () => {
	test("picks the narrowest type every non-empty sample fits", () => {
		expect(inferCsvColumnType(["true", "FALSE", null, ""])).toBe("boolean");
		expect(inferCsvColumnType(["1", "-20", "+3"])).toBe("integer");
		expect(inferCsvColumnType(["1", "2.5", "1e3"])).toBe("double");
		expect(inferCsvColumnType(["2026-10-23", "2026-10-23T09:30:00+07:00", "2026/1/2 08:00"])).toBe("timestamp");
		expect(inferCsvColumnType(['["a"]', '{"b":1}'])).toBe("json");
		expect(inferCsvColumnType(["1", "x"])).toBe("string");
		expect(inferCsvColumnType([null, "", "  "])).toBe("null");
	});

	test("does not read a 2024 column or a nested array as anything but what fits", () => {
		expect(inferCsvColumnType(["2024", "2025"])).toBe("integer");
		expect(inferCsvColumnType(["[[1]]"])).toBe("string");
	});
});

describe("parseCsvCell", () => {
	test("converts cells to tagged values of the chosen type", () => {
		expect(parseCsvCell(" 42 ", "integer", "UTC")).toEqual({ type: "integer", value: "42" });
		expect(parseCsvCell("+9223372036854775807", "integer", "UTC")).toEqual({ type: "integer", value: "9223372036854775807" });
		expect(parseCsvCell("2.50", "double", "UTC")).toEqual({ type: "double", value: 2.5 });
		expect(parseCsvCell("NaN", "double", "UTC")).toEqual({ type: "double", value: "NaN" });
		expect(parseCsvCell("True", "boolean", "UTC")).toEqual({ type: "boolean", value: true });
		expect(parseCsvCell('{"a":[1,2.5]}', "json", "UTC")).toEqual({
			type: "map",
			value: { a: { type: "array", value: [{ type: "integer", value: "1" }, { type: "double", value: 2.5 }] } },
		});
		expect(parseCsvCell("anything", "null", "UTC")).toEqual({ type: "null" });
	});

	test("reads empty cells as null, except a quoted empty string cell", () => {
		expect(parseCsvCell(null, "string", "UTC")).toEqual({ type: "null" });
		expect(parseCsvCell("", "string", "UTC")).toEqual({ type: "string", value: "" });
		expect(parseCsvCell("", "integer", "UTC")).toEqual({ type: "null" });
		expect(parseCsvCell(" ", "timestamp", "UTC")).toEqual({ type: "null" });
	});

	test("explains a cell that does not fit its type", () => {
		expect(() => parseCsvCell("1.5", "integer", "UTC")).toThrow('"1.5" is not a whole number in the 64-bit range.');
		expect(() => parseCsvCell("9223372036854775808", "integer", "UTC")).toThrow("64-bit range");
		expect(() => parseCsvCell("1e999", "double", "UTC")).toThrow('"1e999" is not a number.');
		expect(() => parseCsvCell("yes", "boolean", "UTC")).toThrow('"yes" is not true or false.');
		expect(() => parseCsvCell("2026-02-30", "timestamp", "UTC")).toThrow("is not a date Cinder reads");
		expect(() => parseCsvCell("{nope", "json", "UTC")).toThrow('"{nope" is not valid JSON.');
	});
});

describe("parseCsvTimestamp", () => {
	test("keeps an explicit offset and reads wall times in the chosen zone", () => {
		expect(parseCsvTimestamp("2026-10-23T09:30:00+07:00", "UTC")).toEqual({ seconds: 1792722600, nanos: 0 });
		expect(parseCsvTimestamp("2026-10-23 09:30:00", "Asia/Phnom_Penh")).toEqual({ seconds: 1792722600, nanos: 0 });
		expect(parseCsvTimestamp("2026-10-23T02:30:00.123456789Z", "Asia/Phnom_Penh")).toEqual({ seconds: 1792722600, nanos: 123456789 });
		expect(parseCsvTimestamp("23.10.2026 09:30", "Asia/Phnom_Penh")).toEqual({ seconds: 1792722600, nanos: 0 });
		expect(parseCsvTimestamp("2026/10/23", "UTC")).toEqual({ seconds: 1792713600, nanos: 0 });
	});

	test("follows daylight saving time in the chosen zone", () => {
		expect(parseCsvTimestamp("2026-01-15 12:00", "Europe/Berlin")).toEqual({ seconds: Date.UTC(2026, 0, 15, 11) / 1000, nanos: 0 });
		expect(parseCsvTimestamp("2026-07-15 12:00", "Europe/Berlin")).toEqual({ seconds: Date.UTC(2026, 6, 15, 10) / 1000, nanos: 0 });
		expect(parseCsvTimestamp("2026-07-15 12:00", "America/New_York")).toEqual({ seconds: Date.UTC(2026, 6, 15, 16) / 1000, nanos: 0 });
	});

	test("reads years before 100 and rejects impossible dates", () => {
		expect(parseCsvTimestamp("0001-01-01T00:00:00Z", "UTC")).toEqual({ seconds: -62135596800, nanos: 0 });
		expect(() => parseCsvTimestamp("2026-13-01", "UTC")).toThrow();
		expect(() => parseCsvTimestamp("10/23/2026", "UTC")).toThrow();
	});

	test("knows supported time zones", () => {
		expect(isSupportedTimeZone("UTC")).toBe(true);
		expect(isSupportedTimeZone("Asia/Phnom_Penh")).toBe(true);
		expect(isSupportedTimeZone("Mars/Olympus")).toBe(false);
	});
});

describe("flattenFieldsForCsv", () => {
	test("flattens nested maps to dotted names and writes other values as text", () => {
		expect(
			flattenFieldsForCsv({
				name: { type: "string", value: "Dara" },
				count: { type: "integer", value: "9007199254740993" },
				ratio: { type: "double", value: 2 },
				off: { type: "boolean", value: false },
				none: { type: "null" },
				at: { type: "timestamp", value: { seconds: 1792634400, nanos: 0 } },
				address: { type: "map", value: { city: { type: "string", value: "PP" }, geo: { type: "map", value: { zip: { type: "integer", value: "1" } } } } },
				empty: { type: "map", value: {} },
				tags: { type: "array", value: [{ type: "string", value: "a" }, { type: "map", value: { b: { type: "null" } } }] },
				link: { type: "reference", value: "users/dara" },
			}),
		).toEqual({
			name: "Dara",
			count: "9007199254740993",
			ratio: "2",
			off: "false",
			none: null,
			at: "2026-10-22T02:00:00Z",
			"address.city": "PP",
			"address.geo.zip": "1",
			empty: "{}",
			tags: '["a",{"b":null}]',
			link: "users/dara",
		});
	});
});
