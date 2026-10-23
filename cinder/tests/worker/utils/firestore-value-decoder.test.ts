import { DocumentReference, Firestore, GeoPoint, Timestamp, VectorValue } from "@google-cloud/firestore";
import { describe, expect, test } from "bun:test";
import type { FirestoreValue } from "../../../src/shared/interfaces/firestore-value.interface";
import { decodeFields, decodeValue } from "../../../src/worker/utils/firestore-value-decoder";
import { encodeValue } from "../../../src/worker/utils/firestore-value-encoder";

const db = new Firestore({ projectId: "demo-cinder" });

const ROUND_TRIP_VALUES: FirestoreValue[] = [
	{ type: "null" },
	{ type: "boolean", value: false },
	{ type: "integer", value: "42" },
	{ type: "integer", value: "-9223372036854775808" },
	{ type: "integer", value: "9223372036854775807" },
	{ type: "double", value: 1.5 },
	{ type: "double", value: "NaN" },
	{ type: "double", value: "Infinity" },
	{ type: "double", value: "-Infinity" },
	{ type: "string", value: "ភ្នំពេញ" },
	{ type: "bytes", value: "AQL/" },
	{ type: "timestamp", value: { seconds: 1700000000, nanos: 123456789 } },
	{ type: "geopoint", value: { latitude: 11.55, longitude: 104.92 } },
	{ type: "reference", value: "users/dara/orders/1" },
	{ type: "vector", value: [0.5, 1, 2] },
	{ type: "array", value: [{ type: "string", value: "a" }, { type: "map", value: { n: { type: "integer", value: "1" } } }] },
	{
		type: "map",
		value: {
			"dotted.name": { type: "boolean", value: true },
			nested: { type: "map", value: { when: { type: "timestamp", value: { seconds: 0, nanos: 0 } } } },
		},
	},
];

describe("decodeValue", () => {
	for (const value of ROUND_TRIP_VALUES) {
		test(`round-trips a ${value.type} value with the encoder`, () => {
			expect(encodeValue(decodeValue(value, db))).toEqual(value);
		});
	}

	test("decodes integers as bigint so every digit reaches Firestore", () => {
		expect(decodeValue({ type: "integer", value: "9007199254740993" }, db)).toBe(9007199254740993n);
	});

	test("decodes SDK classes for timestamps, geopoints, references, bytes and vectors", () => {
		expect(decodeValue({ type: "timestamp", value: { seconds: 1, nanos: 2 } }, db)).toEqual(new Timestamp(1, 2));
		expect(decodeValue({ type: "geopoint", value: { latitude: 1, longitude: 2 } }, db)).toBeInstanceOf(GeoPoint);
		const reference = decodeValue({ type: "reference", value: "users/dara" }, db);
		expect(reference).toBeInstanceOf(DocumentReference);
		expect((reference as DocumentReference).path).toBe("users/dara");
		expect(decodeValue({ type: "bytes", value: "Y2luZGVy" }, db)).toEqual(Buffer.from("cinder"));
		expect(decodeValue({ type: "vector", value: [1, 2] }, db)).toBeInstanceOf(VectorValue);
	});

	test("decodes a whole-number double to a plain number, which the SDK writes as an integer", () => {
		expect(decodeValue({ type: "double", value: 2 }, db)).toBe(2);
		expect(encodeValue(decodeValue({ type: "double", value: 2 }, db))).toEqual({ type: "integer", value: "2" });
	});
});

describe("decodeFields", () => {
	test("decodes every top-level field", () => {
		expect(
			decodeFields({ name: { type: "string", value: "Dara" }, count: { type: "integer", value: "3" } }, db),
		).toEqual({ name: "Dara", count: 3n });
	});
});
