import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type {
	Account,
	AccountSummary,
	GoogleUserAccount,
	OAuthClient,
	OAuthClientSettings,
	OAuthClientSource,
} from "../../shared/interfaces/account.interface";
import { isNonEmptyString, isObject } from "../../shared/utils/type-guards";

const FILE_MODE = 0o600;
const DIRECTORY_MODE = 0o700;
const OAUTH_CLIENT_SECRET_NAME = "oauth-client-secret";

interface StoredEmulatorAccount {
	id: string;
	type: "emulator";
	host: string;
	port: number;
	projectIds: string[];
}

interface StoredServiceAccount {
	id: string;
	type: "service-account";
	projectId: string;
	clientEmail: string;
}

interface StoredGoogleUserAccount {
	id: string;
	type: "google-user";
	email: string;
	oauthClientId: string;
	oauthClientSource: OAuthClientSource;
}

interface ActiveOAuthClient {
	source: OAuthClientSource;
	oauthClient: OAuthClient;
}

type StoredAccount = StoredEmulatorAccount | StoredServiceAccount | StoredGoogleUserAccount;

interface AccountFile {
	accounts: StoredAccount[];
	oauthClientId: string | null;
}

interface AccountStorageOptions {
	filePath: string;
	keychainService: string;
	builtInOAuthClient: OAuthClient | null;
}

export class AccountStorage {
	private accounts: Account[] = [];
	private userOAuthClient: OAuthClient | null = null;

	constructor(private readonly options: AccountStorageOptions) {}

	async load(): Promise<void> {
		const file = await this.readFile();
		const accounts: Account[] = [];
		for (const storedAccount of file.accounts) {
			const account = await this.withSecrets(storedAccount);
			if (account) {
				accounts.push(account);
			} else {
				console.warn(`Account ${storedAccount.id} has no secret in the keychain and was skipped.`);
			}
		}
		const clientSecret = file.oauthClientId ? await this.getSecret(OAUTH_CLIENT_SECRET_NAME) : null;
		this.accounts = accounts;
		this.userOAuthClient = file.oauthClientId && clientSecret ? { clientId: file.oauthClientId, clientSecret } : null;
	}

	list(): AccountSummary[] {
		return this.accounts.map(toAccountSummary);
	}

	find(accountId: string): Account | undefined {
		return this.accounts.find((account) => account.id === accountId);
	}

	async add(account: Account): Promise<AccountSummary> {
		const summary = toAccountSummary(account);
		if (this.list().some((existing) => existing.type === summary.type && existing.label === summary.label)) {
			throw new Error(`${summary.label} is already added.`);
		}
		const secrets = secretsOf(account);
		if (secrets) {
			await this.setSecret(account.id, JSON.stringify(secrets));
		}
		const accounts = [...this.accounts, account];
		try {
			await this.writeFile(accounts, this.userOAuthClient?.clientId ?? null);
		} catch (error) {
			await this.deleteSecret(account.id);
			throw error;
		}
		this.accounts = accounts;
		return summary;
	}

	async addGoogleUser(account: GoogleUserAccount): Promise<AccountSummary> {
		const existing = this.accounts.find((stored) => stored.type === "google-user" && stored.email === account.email);
		if (!existing) {
			return this.add(account);
		}
		const replacement: GoogleUserAccount = { ...account, id: existing.id };
		const accounts = this.accounts.map((stored) => (stored === existing ? replacement : stored));
		await this.setSecret(existing.id, JSON.stringify(secretsOf(replacement)));
		try {
			await this.writeFile(accounts, this.userOAuthClient?.clientId ?? null);
		} catch (error) {
			await this.setSecret(existing.id, JSON.stringify(secretsOf(existing)));
			throw error;
		}
		this.accounts = accounts;
		return toAccountSummary(replacement);
	}

	async remove(accountId: string): Promise<void> {
		const accounts = this.accounts.filter((account) => account.id !== accountId);
		await this.writeFile(accounts, this.userOAuthClient?.clientId ?? null);
		this.accounts = accounts;
		await this.deleteSecret(accountId);
	}

	getOAuthClient(): ActiveOAuthClient | null {
		if (this.userOAuthClient) {
			return { source: "user", oauthClient: this.userOAuthClient };
		}
		const { builtInOAuthClient } = this.options;
		return builtInOAuthClient ? { source: "built-in", oauthClient: builtInOAuthClient } : null;
	}

	getOAuthClientSettings(): OAuthClientSettings {
		const hasBuiltInClient = this.options.builtInOAuthClient !== null;
		if (this.userOAuthClient) {
			return { source: "user", clientId: this.userOAuthClient.clientId, hasBuiltInClient };
		}
		return { source: hasBuiltInClient ? "built-in" : "none", clientId: null, hasBuiltInClient };
	}

	async setOAuthClient(oauthClient: OAuthClient): Promise<OAuthClientSettings> {
		await this.setSecret(OAUTH_CLIENT_SECRET_NAME, oauthClient.clientSecret);
		await this.writeFile(this.accounts, oauthClient.clientId);
		this.userOAuthClient = oauthClient;
		return this.getOAuthClientSettings();
	}

	async removeOAuthClient(): Promise<OAuthClientSettings> {
		await this.writeFile(this.accounts, null);
		this.userOAuthClient = null;
		await this.deleteSecret(OAUTH_CLIENT_SECRET_NAME);
		return this.getOAuthClientSettings();
	}

	private async readFile(): Promise<AccountFile> {
		const file = Bun.file(this.options.filePath);
		if (!(await file.exists())) {
			return { accounts: [], oauthClientId: null };
		}
		return parseAccountFile(await file.json());
	}

	private async writeFile(accounts: Account[], oauthClientId: string | null): Promise<void> {
		const file: AccountFile = { accounts: accounts.map(toStoredAccount), oauthClientId };
		const temporaryPath = `${this.options.filePath}.${crypto.randomUUID()}.tmp`;
		await mkdir(dirname(this.options.filePath), { recursive: true, mode: DIRECTORY_MODE });
		await writeFile(temporaryPath, JSON.stringify(file, null, "\t"), { mode: FILE_MODE });
		await rename(temporaryPath, this.options.filePath);
	}

	private async withSecrets(storedAccount: StoredAccount): Promise<Account | null> {
		if (storedAccount.type === "emulator") {
			return storedAccount;
		}
		const secretText = await this.getSecret(storedAccount.id);
		const secrets: unknown = secretText ? JSON.parse(secretText) : null;
		if (!isObject(secrets)) {
			return null;
		}
		if (storedAccount.type === "service-account") {
			return isNonEmptyString(secrets.privateKey) ? { ...storedAccount, privateKey: secrets.privateKey } : null;
		}
		if (!isNonEmptyString(secrets.refreshToken)) {
			return null;
		}
		const { id, email, oauthClientSource, oauthClientId } = storedAccount;
		const account = { id, type: "google-user" as const, email, refreshToken: secrets.refreshToken, oauthClientSource, oauthClientId };
		if (oauthClientSource === "built-in") {
			const { builtInOAuthClient } = this.options;
			return { ...account, oauthClientSecret: builtInOAuthClient?.clientId === oauthClientId ? builtInOAuthClient.clientSecret : null };
		}
		return isNonEmptyString(secrets.clientSecret) ? { ...account, oauthClientSecret: secrets.clientSecret } : null;
	}

	private getSecret(name: string): Promise<string | null> {
		return Bun.secrets.get({ service: this.options.keychainService, name });
	}

	private setSecret(name: string, value: string): Promise<void> {
		return Bun.secrets.set({ service: this.options.keychainService, name, value });
	}

	private async deleteSecret(name: string): Promise<void> {
		await Bun.secrets.delete({ service: this.options.keychainService, name });
	}
}

export function toAccountSummary(account: Account): AccountSummary {
	switch (account.type) {
		case "emulator":
			return { id: account.id, type: account.type, label: `${account.host}:${account.port}` };
		case "service-account":
			return { id: account.id, type: account.type, label: account.clientEmail };
		case "google-user":
			return { id: account.id, type: account.type, label: account.email };
	}
}

function toStoredAccount(account: Account): StoredAccount {
	switch (account.type) {
		case "emulator":
			return { id: account.id, type: account.type, host: account.host, port: account.port, projectIds: account.projectIds };
		case "service-account":
			return { id: account.id, type: account.type, projectId: account.projectId, clientEmail: account.clientEmail };
		case "google-user":
			return {
				id: account.id,
				type: account.type,
				email: account.email,
				oauthClientId: account.oauthClientId,
				oauthClientSource: account.oauthClientSource,
			};
	}
}

function secretsOf(account: Account): Record<string, string> | null {
	switch (account.type) {
		case "emulator":
			return null;
		case "service-account":
			return { privateKey: account.privateKey };
		case "google-user":
			return account.oauthClientSource === "user" && account.oauthClientSecret !== null
				? { refreshToken: account.refreshToken, clientSecret: account.oauthClientSecret }
				: { refreshToken: account.refreshToken };
	}
}

function parseAccountFile(value: unknown): AccountFile {
	if (!isObject(value) || !Array.isArray(value.accounts)) {
		throw new Error("The accounts file is not valid.");
	}
	const oauthClientId = isNonEmptyString(value.oauthClientId) ? value.oauthClientId : null;
	return { accounts: value.accounts.map(parseStoredAccount), oauthClientId };
}

function parseStoredAccount(value: unknown): StoredAccount {
	if (!isObject(value) || !isNonEmptyString(value.id)) {
		throw new Error("The accounts file holds an account without an id.");
	}
	const { id } = value;
	if (
		value.type === "emulator" &&
		isNonEmptyString(value.host) &&
		typeof value.port === "number" &&
		Array.isArray(value.projectIds) &&
		value.projectIds.every(isNonEmptyString)
	) {
		return { id, type: "emulator", host: value.host, port: value.port, projectIds: value.projectIds };
	}
	if (value.type === "service-account" && isNonEmptyString(value.projectId) && isNonEmptyString(value.clientEmail)) {
		return { id, type: "service-account", projectId: value.projectId, clientEmail: value.clientEmail };
	}
	if (value.type === "google-user" && isNonEmptyString(value.email) && isNonEmptyString(value.oauthClientId)) {
		const oauthClientSource = value.oauthClientSource === "built-in" ? "built-in" : "user";
		return { id, type: "google-user", email: value.email, oauthClientId: value.oauthClientId, oauthClientSource };
	}
	throw new Error(`The accounts file holds an invalid account ${id}.`);
}
