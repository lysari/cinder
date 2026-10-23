import { JWT, OAuth2Client } from "google-auth-library";
import type { Account, GoogleUserAccount, ServiceAccount } from "../../shared/interfaces/account.interface";
import type { Project, ProjectDatabases } from "../../shared/interfaces/project.interface";
import { isNonEmptyString, isObject } from "../../shared/utils/type-guards";

const FIREBASE_API_URL = "https://firebase.googleapis.com";
const FIRESTORE_API_URL = "https://firestore.googleapis.com";
const CLOUD_PLATFORM_SCOPE = "https://www.googleapis.com/auth/cloud-platform";
const PROJECT_PAGE_SIZE = 100;
const DEFAULT_DATABASE_ID = "(default)";
const HTTP_FORBIDDEN = 403;

export async function listProjects(account: Account): Promise<Project[]> {
	switch (account.type) {
		case "emulator":
			return account.projectIds.map((projectId) => ({ projectId, displayName: projectId }));
		case "service-account":
			return [{ projectId: account.projectId, displayName: account.projectId }];
		case "google-user":
			return listFirebaseProjects(await getAccessToken(account));
	}
}

export async function listDatabases(account: Account, projectId: string): Promise<ProjectDatabases> {
	if (account.type === "emulator") {
		return { databaseIds: [DEFAULT_DATABASE_ID], warning: null };
	}
	return listFirestoreDatabases(await getAccessToken(account), projectId);
}

export async function listFirebaseProjects(accessToken: string, apiUrl = FIREBASE_API_URL): Promise<Project[]> {
	const projects: Project[] = [];
	let pageToken = "";
	do {
		const url = new URL("/v1beta1/projects", apiUrl);
		url.searchParams.set("pageSize", String(PROJECT_PAGE_SIZE));
		if (pageToken) {
			url.searchParams.set("pageToken", pageToken);
		}
		const body = await readGoogleApiResponse(await fetchGoogleApi(url, accessToken));
		for (const result of Array.isArray(body.results) ? body.results : []) {
			if (isObject(result) && isNonEmptyString(result.projectId)) {
				const displayName = isNonEmptyString(result.displayName) ? result.displayName : result.projectId;
				projects.push({ projectId: result.projectId, displayName });
			}
		}
		pageToken = isNonEmptyString(body.nextPageToken) ? body.nextPageToken : "";
	} while (pageToken);
	return projects;
}

export async function listFirestoreDatabases(
	accessToken: string,
	projectId: string,
	apiUrl = FIRESTORE_API_URL,
): Promise<ProjectDatabases> {
	const url = new URL(`/v1/projects/${encodeURIComponent(projectId)}/databases`, apiUrl);
	const response = await fetchGoogleApi(url, accessToken);
	if (response.status === HTTP_FORBIDDEN) {
		return {
			databaseIds: [DEFAULT_DATABASE_ID],
			warning: `Cinder may not list the databases of ${projectId}, so only ${DEFAULT_DATABASE_ID} is shown. ${await describeGoogleApiError(response)}`,
		};
	}
	const body = await readGoogleApiResponse(response);
	const databaseIds: string[] = [];
	for (const database of Array.isArray(body.databases) ? body.databases : []) {
		if (isObject(database) && isNonEmptyString(database.name)) {
			databaseIds.push(database.name.slice(database.name.lastIndexOf("/") + 1));
		}
	}
	return { databaseIds, warning: null };
}

async function getAccessToken(account: ServiceAccount | GoogleUserAccount): Promise<string> {
	const { token } = await createAuthClient(account).getAccessToken();
	if (!token) {
		throw new Error("Google returned no access token for this account.");
	}
	return token;
}

function createAuthClient(account: ServiceAccount | GoogleUserAccount): JWT | OAuth2Client {
	if (account.type === "service-account") {
		return new JWT({ email: account.clientEmail, key: account.privateKey, scopes: [CLOUD_PLATFORM_SCOPE] });
	}
	const client = new OAuth2Client({ clientId: account.oauthClient.clientId, clientSecret: account.oauthClient.clientSecret });
	client.setCredentials({ refresh_token: account.refreshToken });
	return client;
}

function fetchGoogleApi(url: URL, accessToken: string): Promise<Response> {
	return fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
}

async function readGoogleApiResponse(response: Response): Promise<Record<string, unknown>> {
	if (!response.ok) {
		throw new Error(await describeGoogleApiError(response));
	}
	const body: unknown = await response.json();
	if (!isObject(body)) {
		throw new Error("Google returned an unexpected response.");
	}
	return body;
}

async function describeGoogleApiError(response: Response): Promise<string> {
	const body: unknown = await response.json().catch(() => null);
	const message = isObject(body) && isObject(body.error) && isNonEmptyString(body.error.message) ? body.error.message : response.statusText;
	return `Google answered ${response.status}: ${message}`;
}
