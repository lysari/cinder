export interface EmulatorAccount {
	id: string;
	type: "emulator";
	host: string;
	port: number;
	projectIds: string[];
}

export interface EmulatorAccountForm {
	host: string;
	port: number;
	projectIds: string[];
}

export interface ServiceAccount {
	id: string;
	type: "service-account";
	projectId: string;
	clientEmail: string;
	privateKey: string;
}

export interface OAuthClient {
	clientId: string;
	clientSecret: string;
}

export interface GoogleUserAccount {
	id: string;
	type: "google-user";
	email: string;
	refreshToken: string;
	oauthClient: OAuthClient;
}

export interface OAuthClientSettings {
	clientId: string;
}

export type Account = EmulatorAccount | ServiceAccount | GoogleUserAccount;

export interface AccountSummary {
	id: string;
	type: Account["type"];
	label: string;
}

export interface DatabaseTarget {
	accountId: string;
	projectId: string;
	databaseId: string;
}

export interface ServiceAccountCredentials {
	type: "service_account";
	client_email: string;
	private_key: string;
}

export interface AuthorizedUserCredentials {
	type: "authorized_user";
	client_id: string;
	client_secret: string;
	refresh_token: string;
}

export type GoogleCredentials = ServiceAccountCredentials | AuthorizedUserCredentials;

export interface EmulatorDatabaseSettings {
	type: "emulator";
	projectId: string;
	databaseId: string;
	host: string;
	port: number;
}

export interface CloudDatabaseSettings {
	type: "cloud";
	projectId: string;
	databaseId: string;
	credentials: GoogleCredentials;
}

export type DatabaseSettings = EmulatorDatabaseSettings | CloudDatabaseSettings;
