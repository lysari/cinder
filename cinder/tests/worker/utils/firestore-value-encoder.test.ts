import { FieldValue, Firestore, GeoPoint, Timestamp } from "@google-cloud/firestore";
import { describe, expect, test } from "bun:test";
import { createContext, runInContext } from "node:vm";
import { encodeResult, encodeValue } from "../../../src/worker/utils/firestore-value-encoder";

const db = new Firestore({ projectId: "demo-cinder" });

describe("encodeValue", () => {
	test("encodes null and undefined as null", () => {
		expect(encodeValue(null)).toEqual({ type: "null" });
		expect(encodeValue(undefined)).toEqual({ type: "null" });
	});

	test("encodes booleans and strings", () => {
		expect(encodeValue(true)).toEqual({ type: "boolean", value: true });
		expect(encodeValue("Phnom Penh")).toEqual({ type: "string", value: "Phnom Penh" });
	});

	test("tells integers from doubles", () => {
		expect(encodeValue(42)).toEqual({ type: "integer", value: "42" });
		expect(encodeValue(-7)).toEqual({ type: "integer", value: "-7" });
		expect(encodeValue(9007199254740993n)).toEqual({ type: "integer", value: "9007199254740993" });
		expect(encodeValue(1.5)).toEqual({ type: "double", value: 1.5 });
	});

	test("encodes non-finite doubles as strings", () => {
		expect(encodeValue(Number.NaN)).toEqual({ type: "double", value: "NaN" });
		expect(encodeValue(Number.POSITIVE_INFINITY)).toEqual({ type: "double", value: "Infinity" });
		expect(encodeValue(Number.NEGATIVE_INFINITY)).toEqual({ type: "double", value: "-Infinity" });
	});

	test("encodes bytes as base64", () => {
		expect(encodeValue(Buffer.from("cinder"))).toEqual({ type: "bytes", value: "Y2luZGVy" });
		expect(encodeValue(new Uint8Array([1, 2, 255]))).toEqual({ type: "bytes", value: "AQL/" });
	});

	test("encodes timestamps and dates as seconds and nanos", () => {
		expect(encodeValue(new Timestamp(1700000000, 123000000))).toEqual({
			type: "timestamp",
			value: { seconds: 1700000000, nanos: 123000000 },
		});
		expect(encodeValue(new Date(Date.UTC(2026, 9, 22, 2, 0, 0, 500)))).toEqual({
			type: "timestamp",
			value: { seconds: 1792634400, nanos: 500000000 },
		});
	});

	test("encodes geopoints, references and vectors", () => {
		expect(encodeValue(new GeoPoint(11.55, 104.92))).toEqual({
			type: "geopoint",
			value: { latitude: 11.55, longitude: 104.92 },
		});
		expect(encodeValue(db.doc("cities/pnh"))).toEqual({ type: "reference", value: "cities/pnh" });
		expect(encodeValue(FieldValue.vector([0.5, 1, 2]))).toEqual({ type: "vector", value: [0.5, 1, 2] });
	});

	test("encodes nested arrays and maps", () => {
		expect(encodeValue({ tags: ["a", 1], owner: { name: "Dara", ref: db.doc("users/dara") } })).toEqual({
			type: "map",
			value: {
				tags: {
					type: "array",
					value: [
						{ type: "string", value: "a" },
						{ type: "integer", value: "1" },
					],
				},
				owner: {
					type: "map",
					value: {
						name: { type: "string", value: "Dara" },
						ref: { type: "reference", value: "users/dara" },
					},
				},
			},
		});
	});

	test("encodes objects created inside a script context", () => {
		const value = runInContext("({ when: new Date(0), bytes: new Uint8Array([7]) })", createContext({}));
		expect(encodeValue(value)).toEqual({
			type: "map",
			value: {
				when: { type: "timestamp", value: { seconds: 0, nanos: 0 } },
				bytes: { type: "bytes", value: "Bw==" },
			},
		});
	});

	test("encodes class instances it does not know as text", () => {
		expect(encodeValue(new Map([["a", 1]]))).toEqual({ type: "string", value: "[object Map]" });
	});
});

describe("encodeResult", () => {
	test("wraps a plain value", () => {
		expect(encodeResult(3)).toEqual({ kind: "value", value: { type: "integer", value: "3" } });
		expect(encodeResult(undefined)).toEqual({ kind: "value", value: { type: "null" } });
	});
});
