import {
	EMULATOR_HOST_PATTERN,
	MAX_PORT,
	MIN_PORT,
	OAUTH_CLIENT_ID_PATTERN,
	OAUTH_CLIENT_SECRET_MAX_LENGTH,
	PROJECT_ID_PATTERN,
} from "../shared/constants/account-validation";
import type { DatabaseTarget, EmulatorAccountForm, OAuthClient } from "../shared/interfaces/account.interface";
import type { AccountParams, ProjectParams } from "../shared/interfaces/rpc.interface";
import { isNonEmptyString, isObject } from "../shared/utils/type-guards";

const MISSING_ACCOUNT_ID_MESSAGE = "The request needs an account id.";

export function parseEmulatorAccountForm(value: unknown): EmulatorAccountForm {
	if (!isObject(value)) {
		throw new Error("An emulator account needs a host, port and project ids.");
	}
	if (typeof value.host !== "string" || !EMULATOR_HOST_PATTERN.test(value.host)) {
		throw new Error("The emulator host must be a host name or IPv4 address.");
	}
	if (typeof value.port !== "number" || !Number.isInteger(value.port) || value.port < MIN_PORT || value.port > MAX_PORT) {
		throw new Error(`The emulator port must be a whole number from ${MIN_PORT} to ${MAX_PORT}.`);
	}
	if (!Array.isArray(value.projectIds) || value.projectIds.length === 0) {
		throw new Error("An emulator account needs at least one project id.");
	}
	const projectIds = value.projectIds.map(parseProjectId);
	if (new Set(projectIds).size !== projectIds.length) {
		throw new Error("Each project id may be listed only once.");
	}
	return { host: value.host, port: value.port, projectIds };
}

export function parseOAuthClient(value: unknown): OAuthClient {
	if (!isObject(value) || typeof value.clientId !== "string" || !OAUTH_CLIENT_ID_PATTERN.test(value.clientId)) {
		throw new Error("The client id must end with .apps.googleusercontent.com.");
	}
	if (!isNonEmptyString(value.clientSecret) || value.clientSecret.length > OAUTH_CLIENT_SECRET_MAX_LENGTH) {
		throw new Error("The client secret is missing or too long.");
	}
	return { clientId: value.clientId, clientSecret: value.clientSecret };
}

export function parseAccountParams(value: unknown): AccountParams {
	if (!isObject(value) || !isNonEmptyString(value.accountId)) {
		throw new Error(MISSING_ACCOUNT_ID_MESSAGE);
	}
	return { accountId: value.accountId };
}

export function parseProjectParams(value: unknown): ProjectParams {
	if (!isObject(value) || !isNonEmptyString(value.accountId)) {
		throw new Error(MISSING_ACCOUNT_ID_MESSAGE);
	}
	return { accountId: value.accountId, projectId: parseProjectId(value.projectId) };
}

export function parseDatabaseTarget(value: unknown): DatabaseTarget {
	if (
		!isObject(value) ||
		!isNonEmptyString(value.accountId) ||
		!isNonEmptyString(value.projectId) ||
		!isNonEmptyString(value.databaseId)
	) {
		throw new Error("The request needs an account id, project id and database id.");
	}
	return { accountId: value.accountId, projectId: value.projectId, databaseId: value.databaseId };
}

function parseProjectId(value: unknown): string {
	if (typeof value !== "string" || !PROJECT_ID_PATTERN.test(value)) {
		throw new Error("A project id uses lowercase letters, digits and hyphens, up to 63 characters.");
	}
	return value;
}
