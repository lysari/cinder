import { MAX_ID_BYTES, MAX_INTEGER, MIN_INTEGER } from "../constants/firestore-limits";

const RESERVED_NAME_PATTERN = /^__.*__$/;
const INTEGER_TEXT_PATTERN = /^-?\d+$/;
const BASE64_PATTERN = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
const textEncoder = new TextEncoder();

/** Checks that a text can be a document or collection id: 1 to 1500 bytes, no slash, not "." or "..", not __reserved__. */
export function isValidId(id: string): boolean {
	return id !== "." && id !== ".." && !id.includes("/") && isValidFieldName(id);
}

/** Checks that a text can be a field name or map key: 1 to 1500 bytes and not __reserved__. Dots and slashes are allowed. */
export function isValidFieldName(name: string): boolean {
	return name.length > 0 && !RESERVED_NAME_PATTERN.test(name) && textEncoder.encode(name).length <= MAX_ID_BYTES;
}

/** Checks that a path names a collection, an odd number of valid ids joined by "/", e.g. "users" or "users/dara/orders". */
export function isCollectionPath(path: string): boolean {
	const ids = path.split("/");
	return ids.length % 2 === 1 && ids.every(isValidId);
}

/** Checks that a path names a document, an even number of valid ids joined by "/", e.g. "users/dara". */
export function isDocumentPath(path: string): boolean {
	const ids = path.split("/");
	return ids.length % 2 === 0 && ids.every(isValidId);
}

/** Checks that a text is a whole number in Firestore's signed 64-bit range, written with ASCII digits, e.g. "-42". */
export function isIntegerText(text: string): boolean {
	return INTEGER_TEXT_PATTERN.test(text) && BigInt(text) >= MIN_INTEGER && BigInt(text) <= MAX_INTEGER;
}

/** Checks that a text is padded standard base64, the form bytes values travel in. */
export function isBase64Text(text: string): boolean {
	return BASE64_PATTERN.test(text);
}
