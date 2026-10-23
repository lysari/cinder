import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type {
	Account,
	AccountSummary,
	OAuthClient,
	OAuthClientSettings,
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
}

type StoredAccount = StoredEmulatorAccount | StoredServiceAccount | StoredGoogleUserAccount;

interface AccountFile {
	accounts: StoredAccount[];
	oauthClientId: string | null;
}

interface AccountStorageOptions {
	filePath: string;
	keychainService: string;
}

export class AccountStorage {
	private accounts: Account[] = [];
	private oauthClient: OAuthClient | null = null;

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
		this.oauthClient = file.oauthClientId && clientSecret ? { clientId: file.oauthClientId, clientSecret } : null;
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
			await this.writeFile(accounts, this.oauthClient?.clientId ?? null);
		} catch (error) {
			await this.deleteSecret(account.id);
			throw error;
		}
		this.accounts = accounts;
		return summary;
	}

	async remove(accountId: string): Promise<void> {
		const accounts = this.accounts.filter((account) => account.id !== accountId);
		await this.writeFile(accounts, this.oauthClient?.clientId ?? null);
		this.accounts = accounts;
		await this.deleteSecret(accountId);
	}

	getOAuthClient(): OAuthClient | null {
		return this.oauthClient;
	}

	getOAuthClientSettings(): OAuthClientSettings | null {
		return this.oauthClient ? { clientId: this.oauthClient.clientId } : null;
	}

	async setOAuthClient(oauthClient: OAuthClient): Promise<OAuthClientSettings> {
		await this.setSecret(OAUTH_CLIENT_SECRET_NAME, oauthClient.clientSecret);
		await this.writeFile(this.accounts, oauthClient.clientId);
		this.oauthClient = oauthClient;
		return { clientId: oauthClient.clientId };
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
		if (!isNonEmptyString(secrets.refreshToken) || !isNonEmptyString(secrets.clientSecret)) {
			return null;
		}
		return {
			id: storedAccount.id,
			type: "google-user",
			email: storedAccount.email,
			refreshToken: secrets.refreshToken,
			oauthClient: { clientId: storedAccount.oauthClientId, clientSecret: secrets.clientSecret },
		};
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
			return { id: account.id, type: account.type, email: account.email, oauthClientId: account.oauthClient.clientId };
	}
}

function secretsOf(account: Account): Record<string, string> | null {
	switch (account.type) {
		case "emulator":
			return null;
		case "service-account":
			return { privateKey: account.privateKey };
		case "google-user":
			return { refreshToken: account.refreshToken, clientSecret: account.oauthClient.clientSecret };
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
		return { id, type: "google-user", email: value.email, oauthClientId: value.oauthClientId };
	}
	throw new Error(`The accounts file holds an invalid account ${id}.`);
}
