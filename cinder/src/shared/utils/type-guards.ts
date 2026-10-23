/** Checks that a value is a non-null object whose fields can be read. Use it first when checking parsed JSON or RPC params. */
export function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

/** Checks that a value is a string with at least one character. */
export function isNonEmptyString(value: unknown): value is string {
	return typeof value === "string" && value.length > 0;
}
