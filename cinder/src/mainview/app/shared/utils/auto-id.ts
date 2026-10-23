const AUTO_ID_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const AUTO_ID_LENGTH = 20;

/** Creates a random 20-character document id in the style Firestore generates, so a page can fix the id before it writes. */
export function createAutoId(): string {
	const randomBytes = crypto.getRandomValues(new Uint8Array(AUTO_ID_LENGTH));
	return Array.from(randomBytes, (byte) => AUTO_ID_ALPHABET[byte % AUTO_ID_ALPHABET.length]).join("");
}
