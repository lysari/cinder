import type { FirestoreTimestamp } from "../interfaces/firestore-value.interface";

const MILLIS_PER_SECOND = 1000;
const NANOS_PER_MILLI = 1_000_000;
const NANOS_PER_MICRO = 1000;
const NANOS_DIGITS = 9;

/** Formats a timestamp as an ISO 8601 UTC string with as many fraction digits (0, 3, 6 or 9) as its nanoseconds need. */
export function formatTimestampUtc({ seconds, nanos }: FirestoreTimestamp): string {
	const wholeSeconds = new Date(seconds * MILLIS_PER_SECOND).toISOString().slice(0, 19);
	return `${wholeSeconds}${formatNanosFraction(nanos)}Z`;
}

function formatNanosFraction(nanos: number): string {
	if (nanos === 0) {
		return "";
	}
	const digits = String(nanos).padStart(NANOS_DIGITS, "0");
	if (nanos % NANOS_PER_MILLI === 0) {
		return `.${digits.slice(0, 3)}`;
	}
	return nanos % NANOS_PER_MICRO === 0 ? `.${digits.slice(0, 6)}` : `.${digits}`;
}
