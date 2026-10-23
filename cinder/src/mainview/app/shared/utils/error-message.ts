const FALLBACK_ERROR_MESSAGE = "Something went wrong. Try again.";

/** Turns a thrown value into text for the UI. Pass whatever a failed request or promise rejected with. */
export function errorMessage(error: unknown): string {
	return error instanceof Error && error.message ? error.message : FALLBACK_ERROR_MESSAGE;
}
