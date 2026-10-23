import { describe, expect, test } from "bun:test";
import type { FirestoreValue } from "../../../../../src/shared/interfaces/firestore-value.interface";
import type { ValueDraft } from "../../../../../src/mainview/app/shared/interfaces/value-draft.interface";
import {
	changeDraftType,
	createFieldDraft,
	diffFields,
	draftFromValue,
	fieldDraftsFromFields,
	fieldNameError,
	fieldsFromDrafts,
	hasDraftError,
	hasFieldDraftError,
	parseTimestampText,
	valueError,
	valueFromDraft,
	valueHint,
} from "../../../../../src/mainview/app/shared/utils/value-draft";

const EVERY_TYPE: FirestoreValue[] = [
	{ type: "null" },
	{ type: "boolean", value: true },
	{ type: "integer", value: "-9223372036854775808" },
	{ type: "double", value: 2 },
	{ type: "double", value: "-Infinity" },
	{ type: "string", value: "line one\nline two" },
	{ type: "bytes", value: "AQL/" },
	{ type: "timestamp", value: { seconds: 1700000000, nanos: 123456789 } },
	{ type: "geopoint", value: { latitude: -33.8, longitude: 151.2 } },
	{ type: "reference", value: "users/dara" },
	{ type: "vector", value: [0.5, 1, 2] },
	{ type: "array", value: [{ type: "string", value: "a" }, { type: "map", value: { b: { type: "null" } } }] },
	{ type: "map", value: { "a.b": { type: "integer", value: "1" } } },
];

describe("drafts", () => {
	for (const value of EVERY_TYPE) {
		test(`read a ${value.type} value back unchanged`, () => {
			const draft = draftFromValue(value);
			expect(hasDraftError(draft)).toBe(false);
			expect(valueFromDraft(draft)).toEqual(value);
		});
	}

	test("read digits of any script as numbers", () => {
		expect(valueFromDraft({ type: "integer", text: "១២៣" })).toEqual({ type: "integer", value: "123" });
		expect(valueFromDraft({ type: "integer", text: "123" })).toEqual({ type: "integer", value: "123" });
		expect(valueFromDraft({ type: "double", text: "١٫٥".replace("٫", ".") })).toEqual({ type: "double", value: 1.5 });
		expect(valueFromDraft({ type: "geopoint", latitude: "១១.៥", longitude: "104" })).toEqual({
			type: "geopoint",
			value: { latitude: 11.5, longitude: 104 },
		});
	});

	test("explain each invalid input", () => {
		expect(valueError({ type: "integer", text: "1.5" })).toBe("Enter a whole number from -9223372036854775808 to 9223372036854775807.");
		expect(valueError({ type: "integer", text: "9223372036854775808" })).not.toBeNull();
		expect(valueError({ type: "double", text: "two" })).toBe("Enter a number such as 2.5, or NaN, Infinity or -Infinity.");
		expect(valueError({ type: "timestamp", text: "2026-02-30T00:00:00Z" })).toStartWith("Enter a date and time");
		expect(valueError({ type: "timestamp", text: "2026-10-23T07:05:00" })).not.toBeNull();
		expect(valueError({ type: "reference", text: "users" })).toBe("Enter a document path such as users/dara.");
		expect(valueError({ type: "bytes", text: "abc" })).toBe("Enter base64 text such as Y2luZGVy.");
		expect(valueError({ type: "vector", text: "1, x" })).toBe("Enter numbers separated by commas, such as 0.5, 1, 2.");
		expect(valueError({ type: "geopoint", latitude: "91", longitude: "0" })).toBe("Enter a latitude from -90 to 90.");
		expect(valueError({ type: "geopoint", latitude: "0", longitude: "-181" })).toBe("Enter a longitude from -180 to 180.");
		expect(valueError({ type: "array", items: [{ type: "array", items: [] }] })).toBe(
			"An array cannot hold another array directly; wrap the inner array in a map.",
		);
		expect(valueError({ type: "string", text: "" })).toBeNull();
	});

	test("find errors nested in maps and arrays", () => {
		const draft: ValueDraft = { type: "array", items: [{ type: "map", fields: [createFieldDraft("n", { type: "integer", text: "x" })] }] };
		expect(hasDraftError(draft)).toBe(true);
	});

	test("hint at the local time of a timestamp and at whole-number doubles", () => {
		process.env.TZ = "Asia/Phnom_Penh";
		expect(valueHint({ type: "timestamp", text: "2026-10-22T02:00:00Z" })).toBe("Local time 2026-10-22 09:00:00");
		expect(valueHint({ type: "double", text: "2" })).toBe("Firestore saves a whole number written from Cinder as an integer.");
		expect(valueHint({ type: "double", text: "2.5" })).toBeNull();
	});

	test("keep text when switching between text types and start fresh otherwise", () => {
		expect(changeDraftType({ type: "string", text: "42" }, "integer")).toEqual({ type: "integer", text: "42" });
		expect(changeDraftType({ type: "string", text: "42" }, "boolean")).toEqual({ type: "boolean", value: false });
		expect(changeDraftType({ type: "boolean", value: true }, "string")).toEqual({ type: "string", text: "" });
		expect(changeDraftType({ type: "null" }, "map")).toEqual({ type: "map", fields: [] });
		const timestamp = changeDraftType({ type: "null" }, "timestamp");
		expect(hasDraftError(timestamp)).toBe(false);
	});
});

describe("parseTimestampText", () => {
	test("reads UTC and offset times with up to nine fraction digits", () => {
		expect(parseTimestampText("2026-10-22T02:00:00Z")).toEqual({ seconds: 1792634400, nanos: 0 });
		expect(parseTimestampText("2026-10-22T09:00:00.5+07:00")).toEqual({ seconds: 1792634400, nanos: 500000000 });
		expect(parseTimestampText("2026-10-22 02:00Z")).toEqual({ seconds: 1792634400, nanos: 0 });
		expect(parseTimestampText("0001-01-01T00:00:00Z")).toEqual({ seconds: -62135596800, nanos: 0 });
		expect(parseTimestampText("2026-10-22T02:00:00.1234567891Z")).toBeNull();
		expect(parseTimestampText("2026-10-22T24:00:00Z")).toBeNull();
	});
});

describe("fieldDraftsFromFields", () => {
	test("sorts fields by name in Firestore's code-unit order", () => {
		const drafts = fieldDraftsFromFields({ b: { type: "null" }, B: { type: "null" }, a: { type: "null" }, "~": { type: "null" } });
		expect(drafts.map((field) => field.name)).toEqual(["B", "a", "b", "~"]);
	});
});

describe("field names", () => {
	test("must be present, valid and unique", () => {
		const first = createFieldDraft("name");
		const duplicate = createFieldDraft("name");
		const empty = createFieldDraft("");
		const reserved = createFieldDraft("__id__");
		const fields = [first, duplicate, empty, reserved];
		expect(fieldNameError(fields, first)).toBe("Another field has this name.");
		expect(fieldNameError(fields, empty)).toBe("Enter a field name.");
		expect(fieldNameError(fields, reserved)).toBe("A field name cannot look like __name__ or be longer than 1500 bytes.");
		expect(hasFieldDraftError(fields)).toBe(true);
		expect(hasFieldDraftError([first])).toBe(false);
	});
});

describe("diffFields", () => {
	const original: Record<string, FirestoreValue> = {
		name: { type: "string", value: "Dara" },
		ratio: { type: "double", value: 2 },
		nested: { type: "map", value: { a: { type: "integer", value: "1" }, b: { type: "boolean", value: true } } },
	};

	test("finds no change after a draft round trip, even with map keys in another order", () => {
		const next = fieldsFromDrafts(fieldDraftsFromFields(original));
		expect(diffFields(original, next)).toEqual({ changedFields: {}, deletedFieldNames: [] });
		const reordered = { ...next, nested: { type: "map" as const, value: { b: { type: "boolean" as const, value: true }, a: { type: "integer" as const, value: "1" } } } };
		expect(diffFields(original, reordered)).toEqual({ changedFields: {}, deletedFieldNames: [] });
	});

	test("turns a rename into a delete of the old name and a set of the new one", () => {
		const drafts = fieldDraftsFromFields(original).map((field) => (field.name === "name" ? { ...field, name: "fullName" } : field));
		expect(diffFields(original, fieldsFromDrafts(drafts))).toEqual({
			changedFields: { fullName: { type: "string", value: "Dara" } },
			deletedFieldNames: ["name"],
		});
	});

	test("lists a changed nested value as its top-level field", () => {
		const next = { ...original, nested: { type: "map" as const, value: { a: { type: "integer" as const, value: "2" } } } };
		expect(diffFields(original, next)).toEqual({ changedFields: { nested: next.nested }, deletedFieldNames: [] });
	});
});
