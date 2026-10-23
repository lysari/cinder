import { PROJECT_ID_PATTERN } from "../../shared/constants/account-validation";
import { isNonEmptyString, isObject } from "../../shared/utils/type-guards";

const SERVICE_ACCOUNT_KEY_MAX_BYTES = 16 * 1024;
const PRIVATE_KEY_HEADER = "-----BEGIN PRIVATE KEY-----";
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+$/;

interface ServiceAccountKey {
	projectId: string;
	clientEmail: string;
	privateKey: string;
}

export async function readServiceAccountKey(path: string): Promise<ServiceAccountKey> {
	const file = Bun.file(path);
	if (file.size > SERVICE_ACCOUNT_KEY_MAX_BYTES) {
		throw new Error("The file is too large to be a service account key.");
	}
	return parseServiceAccountKey(await file.text());
}

function parseServiceAccountKey(text: string): ServiceAccountKey {
	let value: unknown;
	try {
		value = JSON.parse(text);
	} catch {
		throw new Error("The file is not a JSON service account key.");
	}
	if (!isObject(value) || value.type !== "service_account") {
		throw new Error("The file is not a service account key: its type must be service_account.");
	}
	if (typeof value.project_id !== "string" || !PROJECT_ID_PATTERN.test(value.project_id)) {
		throw new Error("The service account key has no valid project_id.");
	}
	if (!isNonEmptyString(value.client_email) || !EMAIL_PATTERN.test(value.client_email)) {
		throw new Error("The service account key has no valid client_email.");
	}
	if (!isNonEmptyString(value.private_key) || !value.private_key.startsWith(PRIVATE_KEY_HEADER)) {
		throw new Error("The service account key has no valid private_key.");
	}
	return { projectId: value.project_id, clientEmail: value.client_email, privateKey: value.private_key };
}
