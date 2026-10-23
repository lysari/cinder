import type { FirestoreTimestamp, FirestoreValue, NonFiniteDouble } from "../../../../shared/interfaces/firestore-value.interface";

const MILLIS_PER_SECOND = 1000;
const NANOS_PER_MILLI = 1_000_000;
const MAX_PLAIN_WHOLE_DOUBLE = 1e21;

/** Formats a tagged value as one short line for a table cell or tree row; maps and arrays become a count. */
export function formatValueSummary(value: FirestoreValue): string {
	switch (value.type) {
		case "null":
			return "null";
		case "boolean":
			return String(value.value);
		case "integer":
		case "string":
		case "reference":
			return value.value;
		case "double":
			return formatDouble(value.value);
		case "bytes":
			return `${byteLength(value.value)} bytes`;
		case "timestamp":
			return formatTimestampLocal(value.value);
		case "geopoint":
			return `${value.value.latitude}, ${value.value.longitude}`;
		case "vector":
			return `vector(${value.value.length})`;
		case "array":
			return value.value.length === 1 ? "[1 item]" : `[${value.value.length} items]`;
		case "map": {
			const count = Object.keys(value.value).length;
			return count === 1 ? "{1 field}" : `{${count} fields}`;
		}
	}
}

/** Formats a double so a whole number still reads as a double, e.g. 2 becomes "2.0". Pass the tagged double's value. */
export function formatDouble(value: number | NonFiniteDouble): string {
	if (typeof value === "number" && Number.isInteger(value) && Math.abs(value) < MAX_PLAIN_WHOLE_DOUBLE) {
		return value.toFixed(1);
	}
	return String(value);
}

/** Formats a timestamp in the user's time zone as "YYYY-MM-DD HH:MM:SS", adding milliseconds when there are any. */
export function formatTimestampLocal({ seconds, nanos }: FirestoreTimestamp): string {
	const date = new Date(seconds * MILLIS_PER_SECOND + Math.floor(nanos / NANOS_PER_MILLI));
	const day = `${padNumber(date.getFullYear(), 4)}-${padNumber(date.getMonth() + 1, 2)}-${padNumber(date.getDate(), 2)}`;
	const time = `${padNumber(date.getHours(), 2)}:${padNumber(date.getMinutes(), 2)}:${padNumber(date.getSeconds(), 2)}`;
	const millis = date.getMilliseconds();
	return millis === 0 ? `${day} ${time}` : `${day} ${time}.${padNumber(millis, 3)}`;
}

function padNumber(value: number, length: number): string {
	return String(value).padStart(length, "0");
}

function byteLength(base64: string): number {
	const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
	return (base64.length / 4) * 3 - padding;
}
