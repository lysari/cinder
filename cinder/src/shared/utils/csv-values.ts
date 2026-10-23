import { type CsvColumnType, UTC_TIME_ZONE } from "../constants/data-transfer";
import { MAX_TIMESTAMP_SECONDS, MIN_TIMESTAMP_SECONDS } from "../constants/firestore-limits";
import type { CsvCell } from "../interfaces/csv.interface";
import type { FirestoreTimestamp, FirestoreValue, NonFiniteDouble } from "../interfaces/firestore-value.interface";
import { formatTimestampUtc } from "./firestore-timestamp";
import { isIntegerText } from "./firestore-validation";
import { toReadableJson, valueFromPlainJson } from "./firestore-value-json";

const BOOLEAN_PATTERN = /^(?:true|false)$/i;
const INTEGER_PATTERN = /^[+-]?\d+$/;
const DECIMAL_PATTERN = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i;
const NON_FINITE_DOUBLES: NonFiniteDouble[] = ["NaN", "Infinity", "-Infinity"];
const ISO_TIMESTAMP_PATTERN =
	/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:[.,](\d{1,9}))?)?)?\s*(Z|[+-]\d{2}:?\d{2})?$/i;
const YEAR_FIRST_SLASH_PATTERN = /^(\d{4})\/(\d{1,2})\/(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?)?$/;
const DAY_FIRST_DOT_PATTERN = /^(\d{1,2})\.(\d{1,2})\.(\d{4})(?: (\d{1,2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?)?$/;
const INFERRED_TYPES: CsvColumnType[] = ["boolean", "integer", "double", "timestamp", "json"];
const MILLIS_PER_SECOND = 1000;
const MILLIS_PER_MINUTE = 60_000;
const NANOS_DIGITS = 9;
const MAX_HOUR = 23;
const MAX_MINUTE = 59;
const MAX_SECOND = 59;
const MONTHS_PER_YEAR = 12;
const zoneFormatters = new Map<string, Intl.DateTimeFormat>();

interface WallTime {
	year: number;
	month: number;
	day: number;
	hour: number;
	minute: number;
	second: number;
	nanos: number;
}

/** Flattens a document's fields into CSV cells: nested maps become dotted column names, arrays and other complex values JSON text, timestamps UTC ISO 8601, null an empty cell. */
export function flattenFieldsForCsv(fields: Record<string, FirestoreValue>): Record<string, CsvCell> {
	const cells: Record<string, CsvCell> = {};
	addFlattenedCells(cells, fields, "");
	return cells;
}

/** Infers a CSV column's type from sample cells, ignoring empty ones: boolean, integer, double, timestamp or JSON when every value fits, else string; "null" when all are empty. */
export function inferCsvColumnType(cells: CsvCell[]): CsvColumnType {
	const texts = cells.map((cell) => cell?.trim() ?? "").filter((text) => text.length > 0);
	if (texts.length === 0) {
		return "null";
	}
	const type = INFERRED_TYPES.find((candidate) => texts.every((text) => isCellOfType(text, candidate)));
	return type ?? "string";
}

/** Converts one CSV cell to a tagged value of the chosen type; an empty cell is null except a quoted empty cell in a string column. Throws with the reason. */
export function parseCsvCell(cell: CsvCell, type: CsvColumnType, timeZone: string): FirestoreValue {
	if (cell === null || type === "null") {
		return { type: "null" };
	}
	if (type === "string") {
		return { type: "string", value: cell };
	}
	const text = cell.trim();
	if (text.length === 0) {
		return { type: "null" };
	}
	switch (type) {
		case "integer":
			return { type: "integer", value: parseIntegerText(text) };
		case "double":
			return { type: "double", value: parseDoubleText(text) };
		case "boolean":
			if (!BOOLEAN_PATTERN.test(text)) {
				throw new Error(`"${text}" is not true or false.`);
			}
			return { type: "boolean", value: text.toLowerCase() === "true" };
		case "timestamp":
			return { type: "timestamp", value: parseCsvTimestamp(text, timeZone) };
		case "json":
			return parseJsonText(text);
	}
}

/** Reads a date and time in ISO 8601, YYYY/MM/DD or DD.MM.YYYY form; a value without Z or an offset is taken as wall time in `timeZone` (an IANA name). Throws when it is not one. */
export function parseCsvTimestamp(text: string, timeZone: string): FirestoreTimestamp {
	const parsed = parseWallTime(text);
	if (!parsed || !isValidWallTime(parsed.wallTime)) {
		throw new Error(`"${text}" is not a date Cinder reads, such as 2026-10-23 or 2026-10-23T09:30:00+07:00.`);
	}
	const { wallTime, offset } = parsed;
	const wallMillis = utcMillis(wallTime);
	const epochMillis = offset === null ? wallMillis - wallTimeOffsetMillis(wallMillis, timeZone) : wallMillis - offsetMillis(offset);
	const seconds = Math.floor(epochMillis / MILLIS_PER_SECOND);
	if (seconds < MIN_TIMESTAMP_SECONDS || seconds > MAX_TIMESTAMP_SECONDS) {
		throw new Error(`"${text}" lies outside the years 1 to 9999.`);
	}
	return { seconds, nanos: wallTime.nanos };
}

/** Checks that a time zone name is one this runtime knows, e.g. "Asia/Phnom_Penh" or "UTC". */
export function isSupportedTimeZone(timeZone: string): boolean {
	return timeZone === UTC_TIME_ZONE || Intl.supportedValuesOf("timeZone").includes(timeZone);
}

function addFlattenedCells(cells: Record<string, CsvCell>, fields: Record<string, FirestoreValue>, prefix: string): void {
	for (const [name, value] of Object.entries(fields)) {
		const column = `${prefix}${name}`;
		if (value.type === "map" && Object.keys(value.value).length > 0) {
			addFlattenedCells(cells, value.value, `${column}.`);
		} else {
			cells[column] = cellText(value);
		}
	}
}

function cellText(value: FirestoreValue): CsvCell {
	switch (value.type) {
		case "null":
			return null;
		case "boolean":
		case "double":
			return String(value.value);
		case "integer":
		case "string":
		case "bytes":
		case "reference":
			return value.value;
		case "timestamp":
			return formatTimestampUtc(value.value);
		case "geopoint":
		case "vector":
		case "array":
		case "map":
			return JSON.stringify(toReadableJson(value));
	}
}

function isCellOfType(text: string, type: CsvColumnType): boolean {
	if (type === "json" && !text.startsWith("[") && !text.startsWith("{")) {
		return false;
	}
	try {
		parseCsvCell(text, type, UTC_TIME_ZONE);
		return true;
	} catch {
		return false;
	}
}

function parseIntegerText(text: string): string {
	const digits = text.startsWith("+") ? text.slice(1) : text;
	if (!INTEGER_PATTERN.test(text) || !isIntegerText(digits)) {
		throw new Error(`"${text}" is not a whole number in the 64-bit range.`);
	}
	return BigInt(digits).toString();
}

function parseDoubleText(text: string): number | NonFiniteDouble {
	const nonFinite = NON_FINITE_DOUBLES.find((candidate) => candidate === text);
	if (nonFinite) {
		return nonFinite;
	}
	const value = Number(text);
	if (!DECIMAL_PATTERN.test(text) || !Number.isFinite(value)) {
		throw new Error(`"${text}" is not a number.`);
	}
	return value;
}

function parseJsonText(text: string): FirestoreValue {
	let value: unknown;
	try {
		value = JSON.parse(text);
	} catch {
		throw new Error(`"${text}" is not valid JSON.`);
	}
	return valueFromPlainJson(value);
}

function parseWallTime(text: string): { wallTime: WallTime; offset: string | null } | null {
	const iso = ISO_TIMESTAMP_PATTERN.exec(text);
	if (iso) {
		const [, year, month, day, hour, minute, second, fraction, offset] = iso;
		return { wallTime: wallTimeOf(year, month, day, hour, minute, second, fraction), offset: offset ?? null };
	}
	const yearFirst = YEAR_FIRST_SLASH_PATTERN.exec(text);
	if (yearFirst) {
		const [, year, month, day, hour, minute, second, fraction] = yearFirst;
		return { wallTime: wallTimeOf(year, month, day, hour, minute, second, fraction), offset: null };
	}
	const dayFirst = DAY_FIRST_DOT_PATTERN.exec(text);
	if (dayFirst) {
		const [, day, month, year, hour, minute, second, fraction] = dayFirst;
		return { wallTime: wallTimeOf(year, month, day, hour, minute, second, fraction), offset: null };
	}
	return null;
}

function wallTimeOf(...parts: (string | undefined)[]): WallTime {
	const [year, month, day, hour, minute, second, fraction] = parts;
	return {
		year: Number(year),
		month: Number(month),
		day: Number(day),
		hour: Number(hour ?? 0),
		minute: Number(minute ?? 0),
		second: Number(second ?? 0),
		nanos: Number((fraction ?? "").padEnd(NANOS_DIGITS, "0")),
	};
}

function isValidWallTime({ year, month, day, hour, minute, second }: WallTime): boolean {
	return (
		month >= 1 &&
		month <= MONTHS_PER_YEAR &&
		day >= 1 &&
		day <= daysInMonth(year, month) &&
		hour <= MAX_HOUR &&
		minute <= MAX_MINUTE &&
		second <= MAX_SECOND
	);
}

function daysInMonth(year: number, month: number): number {
	const date = new Date(0);
	date.setUTCFullYear(year, month, 0);
	return date.getUTCDate();
}

function utcMillis({ year, month, day, hour, minute, second }: Omit<WallTime, "nanos">): number {
	const date = new Date(0);
	date.setUTCFullYear(year, month - 1, day);
	date.setUTCHours(hour, minute, second, 0);
	return date.getTime();
}

function offsetMillis(offset: string): number {
	if (offset.toUpperCase() === "Z") {
		return 0;
	}
	const digits = offset.slice(1).replace(":", "");
	const minutes = Number(digits.slice(0, 2)) * 60 + Number(digits.slice(2));
	return (offset.startsWith("-") ? -minutes : minutes) * MILLIS_PER_MINUTE;
}

function wallTimeOffsetMillis(wallMillis: number, timeZone: string): number {
	const firstGuess = zoneOffsetMillis(wallMillis, timeZone);
	return zoneOffsetMillis(wallMillis - firstGuess, timeZone);
}

function zoneOffsetMillis(epochMillis: number, timeZone: string): number {
	const parts = Object.fromEntries(
		zoneFormatter(timeZone)
			.formatToParts(new Date(epochMillis))
			.map((part) => [part.type, Number(part.value)]),
	);
	const zoneWallMillis = utcMillis({
		year: parts.year ?? 0,
		month: parts.month ?? 1,
		day: parts.day ?? 1,
		hour: parts.hour ?? 0,
		minute: parts.minute ?? 0,
		second: parts.second ?? 0,
	});
	return zoneWallMillis - Math.floor(epochMillis / MILLIS_PER_SECOND) * MILLIS_PER_SECOND;
}

function zoneFormatter(timeZone: string): Intl.DateTimeFormat {
	let formatter = zoneFormatters.get(timeZone);
	if (!formatter) {
		formatter = new Intl.DateTimeFormat("en-US", {
			timeZone,
			hourCycle: "h23",
			year: "numeric",
			month: "numeric",
			day: "numeric",
			hour: "numeric",
			minute: "numeric",
			second: "numeric",
		});
		zoneFormatters.set(timeZone, formatter);
	}
	return formatter;
}
