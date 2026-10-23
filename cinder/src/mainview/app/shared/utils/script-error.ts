const SCRIPT_LOCATION_PATTERN = /script\.js:(\d+)(?::(\d+))?/;

/** Finds the line (and column, when known) of a failed run-script task in its error text, which names the script as script.js. */
export function scriptErrorLocation(error: string): { line: number; column: number | null } | null {
	const match = SCRIPT_LOCATION_PATTERN.exec(error);
	if (!match) {
		return null;
	}
	return { line: Number(match[1]), column: match[2] === undefined ? null : Number(match[2]) };
}
