import {
	MAX_LATITUDE,
	MAX_LONGITUDE,
	MAX_TIMESTAMP_SECONDS,
	MIN_LATITUDE,
	MIN_LONGITUDE,
	MIN_TIMESTAMP_SECONDS,
} from "../../../../shared/constants/firestore-limits";
import type { FirestoreTimestamp, FirestoreValue, NonFiniteDouble } from "../../../../shared/interfaces/firestore-value.interface";
import { formatTimestampUtc } from "../../../../shared/utils/firestore-timestamp";
import {
	isBase64Text,
	isDocumentPath,
	isIntegerText,
	isValidFieldName,
} from "../../../../shared/utils/firestore-validation";
import type { FieldChanges, FieldDraft, GeoPointDraft, ValueDraft, ValueType } from "../interfaces/value-draft.interface";
import { formatTimestampLocal } from "./firestore-value-format";

const NON_FINITE_DOUBLES: NonFiniteDouble[] = ["NaN", "Infinity", "-Infinity"];
const DECIMAL_PATTERN = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i;
const TIMESTAMP_PATTERN = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?(Z|[+-]\d{2}:\d{2})$/i;
const DECIMAL_DIGIT_PATTERN = /\p{Nd}/gu;
const SINGLE_DECIMAL_DIGIT_PATTERN = /^\p{Nd}$/u;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const MILLIS_PER_SECOND = 1000;
const NANOS_DIGITS = 9;
const ASCII_DIGITS = buildAsciiDigits();

let nextFieldDraftId = 1;

/** Creates an editable draft of a tagged value. Pass a field's value; read it back with `valueFromDraft`. */
export function draftFromValue(value: FirestoreValue): ValueDraft {
	switch (value.type) {
		case "null":
			return { type: "null" };
		case "boolean":
			return { type: "boolean", value: value.value };
		case "integer":
		case "string":
		case "bytes":
		case "reference":
			return { type: value.type, text: value.value };
		case "double":
			return { type: "double", text: String(value.value) };
		case "timestamp":
			return { type: "timestamp", text: formatTimestampUtc(value.value) };
		case "vector":
			return { type: "vector", text: value.value.join(", ") };
		case "geopoint":
			return { type: "geopoint", latitude: String(value.value.latitude), longitude: String(value.value.longitude) };
		case "array":
			return { type: "array", items: value.value.map(draftFromValue) };
		case "map":
			return { type: "map", fields: fieldDraftsFromFields(value.value) };
	}
}

/** Creates the field drafts of a document or map, one per field, sorted by name like Firestore orders map keys. */
export function fieldDraftsFromFields(fields: Record<string, FirestoreValue>): FieldDraft[] {
	return Object.entries(fields)
		.sort(([first], [second]) => compareNames(first, second))
		.map(([name, value]) => createFieldDraft(name, draftFromValue(value)));
}

/** Compares two field names or ids in Firestore's order, by UTF-16 code units. Pass it to `Array.prototype.sort`. */
export function compareNames(first: string, second: string): number {
	return first < second ? -1 : first > second ? 1 : 0;
}

/** Creates a field draft with a fresh id for tracking it in a list. Pass the name and value, or nothing for an empty string field. */
export function createFieldDraft(name = "", value: ValueDraft = { type: "string", text: "" }): FieldDraft {
	return { id: nextFieldDraftId++, name, value };
}

/** Changes the type of a draft, keeping the text when both types are typed as text, otherwise starting from an empty value. */
export function changeDraftType(draft: ValueDraft, type: ValueType): ValueDraft {
	switch (type) {
		case "null":
			return { type: "null" };
		case "boolean":
			return { type: "boolean", value: false };
		case "geopoint":
			return { type: "geopoint", latitude: "0", longitude: "0" };
		case "map":
			return { type: "map", fields: [] };
		case "array":
			return { type: "array", items: [] };
		case "timestamp":
			return { type: "timestamp", text: "text" in draft ? draft.text : formatTimestampUtc(currentTimestamp()) };
		default:
			return { type, text: "text" in draft ? draft.text : "" };
	}
}

/** Returns why a draft's own input is not a valid value, or null when it is; nested fields and items are checked separately. */
export function valueError(draft: ValueDraft): string | null {
	switch (draft.type) {
		case "integer":
			return isIntegerText(normalizeNumberText(draft.text))
				? null
				: "Enter a whole number from -9223372036854775808 to 9223372036854775807.";
		case "double":
			return parseDouble(draft.text) === null ? "Enter a number such as 2.5, or NaN, Infinity or -Infinity." : null;
		case "timestamp":
			return parseTimestampText(draft.text) === null
				? "Enter a date and time from the years 1 to 9999 with its offset, such as 2026-10-23T07:05:00Z."
				: null;
		case "reference":
			return isDocumentPath(draft.text) ? null : "Enter a document path such as users/dara.";
		case "bytes":
			return isBase64Text(draft.text.trim()) ? null : "Enter base64 text such as Y2luZGVy.";
		case "vector":
			return parseVector(draft.text) === null ? "Enter numbers separated by commas, such as 0.5, 1, 2." : null;
		case "geopoint":
			return geoPointError(draft);
		case "array":
			return draft.items.some((item) => item.type === "array")
				? "An array cannot hold another array directly; wrap the inner array in a map."
				: null;
		default:
			return null;
	}
}

/** Returns why a field's name cannot be saved among its sibling fields, or null when it can. */
export function fieldNameError(fields: FieldDraft[], field: FieldDraft): string | null {
	if (field.name.length === 0) {
		return "Enter a field name.";
	}
	if (!isValidFieldName(field.name)) {
		return "A field name cannot look like __name__ or be longer than 1500 bytes.";
	}
	return fields.some((other) => other.id !== field.id && other.name === field.name) ? "Another field has this name." : null;
}

/** Checks a draft and everything nested in it, field names included. Use it to disable saving. */
export function hasDraftError(draft: ValueDraft): boolean {
	if (draft.type === "map") {
		return hasFieldDraftError(draft.fields);
	}
	if (draft.type === "array") {
		return valueError(draft) !== null || draft.items.some(hasDraftError);
	}
	return valueError(draft) !== null;
}

/** Checks a list of field drafts, their names and their values. Pass a document's top-level field drafts. */
export function hasFieldDraftError(fields: FieldDraft[]): boolean {
	return fields.some((field) => fieldNameError(fields, field) !== null || hasDraftError(field.value));
}

/** Returns a note to show under a valid input: a timestamp's local time. */
export function valueHint(draft: ValueDraft): string | null {
	if (draft.type !== "timestamp") {
		return null;
	}
	const timestamp = parseTimestampText(draft.text);
	return timestamp ? `Local time ${formatTimestampLocal(timestamp)}` : null;
}

/** Reads the tagged value of a draft without errors (check `hasDraftError` first); digits of any script are read as numbers. */
export function valueFromDraft(draft: ValueDraft): FirestoreValue {
	switch (draft.type) {
		case "null":
		case "boolean":
			return draft;
		case "string":
			return { type: "string", value: draft.text };
		case "reference":
			return { type: "reference", value: draft.text };
		case "integer":
			return { type: "integer", value: BigInt(normalizeNumberText(draft.text)).toString() };
		case "double":
			return { type: "double", value: requireParsed(parseDouble(draft.text)) };
		case "bytes":
			return { type: "bytes", value: draft.text.trim() };
		case "timestamp":
			return { type: "timestamp", value: requireParsed(parseTimestampText(draft.text)) };
		case "vector":
			return { type: "vector", value: requireParsed(parseVector(draft.text)) };
		case "geopoint":
			return {
				type: "geopoint",
				value: { latitude: requireParsed(parseDecimal(draft.latitude)), longitude: requireParsed(parseDecimal(draft.longitude)) },
			};
		case "array":
			return { type: "array", value: draft.items.map(valueFromDraft) };
		case "map":
			return { type: "map", value: fieldsFromDrafts(draft.fields) };
	}
}

/** Reads document fields from field drafts without errors. Pass a document's top-level field drafts. */
export function fieldsFromDrafts(fields: FieldDraft[]): Record<string, FirestoreValue> {
	return Object.fromEntries(fields.map((field) => [field.name, valueFromDraft(field.value)]));
}

/** Lists the top-level fields that differ between two versions of a document, for an update that writes only those. */
export function diffFields(original: Record<string, FirestoreValue>, next: Record<string, FirestoreValue>): FieldChanges {
	const changedFields = Object.fromEntries(
		Object.entries(next).filter(([name, value]) => !Object.hasOwn(original, name) || !isSameValue(original[name], value)),
	);
	const deletedFieldNames = Object.keys(original).filter((name) => !Object.hasOwn(next, name));
	return { changedFields, deletedFieldNames };
}

/** Reads a timestamp typed as ISO 8601 with an offset, such as 2026-10-23T14:05:00.5+07:00, or returns null when it is not one. */
export function parseTimestampText(text: string): FirestoreTimestamp | null {
	const match = TIMESTAMP_PATTERN.exec(normalizeNumberText(text));
	if (!match) {
		return null;
	}
	const [, year, month, day, hour, minute, second = "0", fraction = "", zone] = match;
	const date = new Date(0);
	date.setUTCFullYear(Number(year), Number(month) - 1, Number(day));
	date.setUTCHours(Number(hour), Number(minute), Number(second));
	const isRealDate =
		date.getUTCFullYear() === Number(year) &&
		date.getUTCMonth() === Number(month) - 1 &&
		date.getUTCDate() === Number(day) &&
		date.getUTCHours() === Number(hour) &&
		date.getUTCMinutes() === Number(minute) &&
		date.getUTCSeconds() === Number(second);
	const seconds = date.getTime() / MILLIS_PER_SECOND - offsetMinutes(zone) * SECONDS_PER_MINUTE;
	if (!isRealDate || seconds < MIN_TIMESTAMP_SECONDS || seconds > MAX_TIMESTAMP_SECONDS) {
		return null;
	}
	return { seconds, nanos: Number(fraction.padEnd(NANOS_DIGITS, "0")) };
}

function offsetMinutes(zone: string): number {
	if (zone.toUpperCase() === "Z") {
		return 0;
	}
	const sign = zone.startsWith("-") ? -1 : 1;
	return sign * (Number(zone.slice(1, 3)) * MINUTES_PER_HOUR + Number(zone.slice(4, 6)));
}

function parseDouble(text: string): number | NonFiniteDouble | null {
	const nonFinite = NON_FINITE_DOUBLES.find((value) => value === text.trim());
	return nonFinite ?? parseDecimal(text);
}

function parseDecimal(text: string): number | null {
	const normalized = normalizeNumberText(text);
	if (!DECIMAL_PATTERN.test(normalized)) {
		return null;
	}
	const value = Number(normalized);
	return Number.isFinite(value) ? value : null;
}

function parseVector(text: string): number[] | null {
	const values = text.split(",").map(parseDecimal);
	return values.every((value) => value !== null) ? (values as number[]) : null;
}

function geoPointError(draft: GeoPointDraft): string | null {
	const latitude = parseDecimal(draft.latitude);
	if (latitude === null || latitude < MIN_LATITUDE || latitude > MAX_LATITUDE) {
		return "Enter a latitude from -90 to 90.";
	}
	const longitude = parseDecimal(draft.longitude);
	if (longitude === null || longitude < MIN_LONGITUDE || longitude > MAX_LONGITUDE) {
		return "Enter a longitude from -180 to 180.";
	}
	return null;
}

function requireParsed<T>(value: T | null): T {
	if (value === null) {
		throw new Error("The draft has an invalid value.");
	}
	return value;
}

function isSameValue(first: FirestoreValue | undefined, second: FirestoreValue): boolean {
	return first !== undefined && canonicalJson(first) === canonicalJson(second);
}

function canonicalJson(value: unknown): string {
	return JSON.stringify(value, (_key, nested: unknown) =>
		nested && typeof nested === "object" && !Array.isArray(nested)
			? Object.fromEntries(Object.entries(nested).sort(([first], [second]) => compareNames(first, second)))
			: nested,
	);
}

function currentTimestamp(): FirestoreTimestamp {
	return { seconds: Math.floor(Date.now() / MILLIS_PER_SECOND), nanos: 0 };
}

function normalizeNumberText(text: string): string {
	return text.trim().replace(DECIMAL_DIGIT_PATTERN, (digit) => ASCII_DIGITS.get(digit) ?? digit);
}

function buildAsciiDigits(): Map<string, string> {
	const digits = new Map<string, string>();
	for (const numberingSystem of Intl.supportedValuesOf("numberingSystem")) {
		const format = new Intl.NumberFormat("en", { numberingSystem, useGrouping: false });
		for (let digit = 0; digit <= 9; digit += 1) {
			const glyph = format.format(digit);
			if (SINGLE_DECIMAL_DIGIT_PATTERN.test(glyph)) {
				digits.set(glyph, String(digit));
			}
		}
	}
	return digits;
}
