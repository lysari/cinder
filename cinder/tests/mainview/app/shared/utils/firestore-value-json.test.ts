import { describe, expect, test } from "bun:test";
import { documentsToReadableJson, toReadableJson } from "../../../../../src/mainview/app/shared/utils/firestore-value-json";

describe("toReadableJson", () => {
	test("maps each tagged type to plain JSON", () => {
		expect(toReadableJson({ type: "null" })).toBeNull();
		expect(toReadableJson({ type: "boolean", value: true })).toBe(true);
		expect(toReadableJson({ type: "integer", value: "42" })).toBe(42);
		expect(toReadableJson({ type: "integer", value: "9007199254740993" })).toBe("9007199254740993");
		expect(toReadableJson({ type: "double", value: 2 })).toBe(2);
		expect(toReadableJson({ type: "double", value: "Infinity" })).toBe("Infinity");
		expect(toReadableJson({ type: "string", value: "Dara" })).toBe("Dara");
		expect(toReadableJson({ type: "bytes", value: "AQL/" })).toBe("AQL/");
		expect(toReadableJson({ type: "timestamp", value: { seconds: 1792634400, nanos: 0 } })).toBe("2026-10-22T02:00:00Z");
		expect(toReadableJson({ type: "geopoint", value: { latitude: 1, longitude: 2 } })).toEqual({ latitude: 1, longitude: 2 });
		expect(toReadableJson({ type: "reference", value: "users/dara" })).toBe("users/dara");
		expect(toReadableJson({ type: "vector", value: [0.5, 1] })).toEqual([0.5, 1]);
	});

	test("maps nested arrays and maps", () => {
		expect(
			toReadableJson({
				type: "map",
				value: { tags: { type: "array", value: [{ type: "string", value: "a" }, { type: "map", value: { n: { type: "null" } } }] } },
			}),
		).toEqual({ tags: ["a", { n: null }] });
	});
});

describe("documentsToReadableJson", () => {
	test("keys documents by id", () => {
		const time = { seconds: 0, nanos: 0 };
		expect(
			documentsToReadableJson([
				{ path: "users/a", id: "a", fields: { n: { type: "integer", value: "1" } }, createTime: time, updateTime: time },
				{ path: "users/b", id: "b", fields: {}, createTime: time, updateTime: time },
			]),
		).toEqual({ a: { n: 1 }, b: {} });
	});
});
