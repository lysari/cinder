import { parseOAuthClient } from "../src/bun/account-request-parser";
import type { OAuthClient } from "../src/shared/interfaces/account.interface";

export const BUILT_IN_OAUTH_CLIENT_FILE = "google-oauth-client.local.json";

export async function readBuiltInOAuthClient(filePath: string): Promise<OAuthClient | null> {
	const file = Bun.file(filePath);
	if (!(await file.exists())) {
		return null;
	}
	let value: unknown;
	try {
		value = JSON.parse(await file.text());
	} catch {
		throw new Error(`${filePath} is not valid JSON. Copy google-oauth-client.example.json and fill in your client.`);
	}
	try {
		return parseOAuthClient(value);
	} catch (error) {
		throw new Error(`${filePath} does not hold a valid Google OAuth client: ${(error as Error).message}`);
	}
}
