import { afterAll, describe, expect, test } from "bun:test";
import { mkdtemp, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AccountStorage } from "../../../src/bun/services/account-storage";
import { resolveDatabaseSettings } from "../../../src/bun/services/database-settings";
import { listProjects } from "../../../src/bun/services/project-listing";
import { TaskQueue } from "../../../src/bun/services/task-queue";
import type {
	EmulatorAccount,
	GoogleUserAccount,
	OAuthClient,
	OAuthClientSettings,
	ServiceAccount,
} from "../../../src/shared/interfaces/account.interface";
import type { TaskUpdate } from "../../../src/shared/interfaces/task.interface";
import { createFirestore } from "../../../src/worker/firestore-client";

const KEYCHAIN_SERVICE = `app.cinder.desktop.test-${crypto.randomUUID()}`;
const OAUTH_CLIENT = { clientId: "test-client.apps.googleusercontent.com", clientSecret: "test-oauth-client-secret" };
const BUILT_IN_OAUTH_CLIENT = { clientId: "built-in-client.apps.googleusercontent.com", clientSecret: "test-built-in-client-secret" };
const OTHER_BUILT_IN_OAUTH_CLIENT = { clientId: "other-built-in.apps.googleusercontent.com", clientSecret: "test-other-built-in-secret" };
const DATABASE_TARGET = { accountId: "", projectId: "demo-cinder", databaseId: "(default)" };
const EMULATOR_ACCOUNT: EmulatorAccount = {
	id: crypto.randomUUID(),
	type: "emulator",
	host: "127.0.0.1",
	port: 8080,
	projectIds: ["demo-cinder"],
};
const SERVICE_ACCOUNT: ServiceAccount = {
	id: crypto.randomUUID(),
	type: "service-account",
	projectId: "key-project",
	clientEmail: "reader@key-project.iam.gserviceaccount.com",
	privateKey: "-----BEGIN PRIVATE KEY-----\ntest-private-key\n-----END PRIVATE KEY-----\n",
};
const GOOGLE_USER_ACCOUNT: GoogleUserAccount = {
	id: crypto.randomUUID(),
	type: "google-user",
	email: "dara@example.com",
	refreshToken: "test-refresh-token",
	oauthClientSource: "user",
	oauthClientId: "older-client.apps.googleusercontent.com",
	oauthClientSecret: "test-older-client-secret",
};
const BUILT_IN_CLIENT_ACCOUNT: GoogleUserAccount = {
	id: crypto.randomUUID(),
	type: "google-user",
	email: "sokha@example.com",
	refreshToken: "test-built-in-refresh-token",
	oauthClientSource: "built-in",
	oauthClientId: BUILT_IN_OAUTH_CLIENT.clientId,
	oauthClientSecret: BUILT_IN_OAUTH_CLIENT.clientSecret,
};
const WORKER_PATH = join(import.meta.dir, "../../../src/worker/index.ts");
const temporaryDirectory = await mkdtemp(join(tmpdir(), "cinder-account-storage-"));
let fileCount = 0;

function createStorage(
	filePath = join(temporaryDirectory, `accounts-${++fileCount}.json`),
	builtInOAuthClient: OAuthClient | null = null,
) {
	return { filePath, storage: new AccountStorage({ filePath, keychainService: KEYCHAIN_SERVICE, builtInOAuthClient }) };
}

function getSecret(name: string) {
	return Bun.secrets.get({ service: KEYCHAIN_SERVICE, name });
}

afterAll(async () => {
	for (const name of [
		EMULATOR_ACCOUNT.id,
		SERVICE_ACCOUNT.id,
		GOOGLE_USER_ACCOUNT.id,
		BUILT_IN_CLIENT_ACCOUNT.id,
		"oauth-client-secret",
	]) {
		await Bun.secrets.delete({ service: KEYCHAIN_SERVICE, name });
	}
	await rm(temporaryDirectory, { recursive: true, force: true });
});

describe("AccountStorage", () => {
	test("keeps accounts and the OAuth client across a reload", async () => {
		const { filePath, storage } = createStorage();
		await storage.load();
		await storage.add(EMULATOR_ACCOUNT);
		await storage.add(SERVICE_ACCOUNT);
		await storage.add(GOOGLE_USER_ACCOUNT);
		await storage.setOAuthClient(OAUTH_CLIENT);

		const reloaded = createStorage(filePath).storage;
		await reloaded.load();
		expect(reloaded.find(EMULATOR_ACCOUNT.id)).toEqual(EMULATOR_ACCOUNT);
		expect(reloaded.find(SERVICE_ACCOUNT.id)).toEqual(SERVICE_ACCOUNT);
		expect(reloaded.find(GOOGLE_USER_ACCOUNT.id)).toEqual(GOOGLE_USER_ACCOUNT);
		expect(reloaded.getOAuthClient()).toEqual({ source: "user", oauthClient: OAUTH_CLIENT });
		expect(reloaded.getOAuthClientSettings()).toEqual({ source: "user", clientId: OAUTH_CLIENT.clientId, hasBuiltInClient: false });
		expect(reloaded.list()).toEqual([
			{ id: EMULATOR_ACCOUNT.id, type: "emulator", label: "127.0.0.1:8080" },
			{ id: SERVICE_ACCOUNT.id, type: "service-account", label: SERVICE_ACCOUNT.clientEmail },
			{ id: GOOGLE_USER_ACCOUNT.id, type: "google-user", label: GOOGLE_USER_ACCOUNT.email },
		]);

		const fileText = await Bun.file(filePath).text();
		for (const secret of [
			SERVICE_ACCOUNT.privateKey,
			"test-private-key",
			GOOGLE_USER_ACCOUNT.refreshToken,
			GOOGLE_USER_ACCOUNT.oauthClientSecret as string,
			OAUTH_CLIENT.clientSecret,
		]) {
			expect(fileText).not.toContain(secret);
		}
		expect(((await stat(filePath)).mode & 0o777).toString(8)).toBe("600");

		await reloaded.remove(SERVICE_ACCOUNT.id);
		await reloaded.remove(GOOGLE_USER_ACCOUNT.id);
		await reloaded.remove(EMULATOR_ACCOUNT.id);
	});

	test("deletes an account's keychain secret when it is removed", async () => {
		const { filePath, storage } = createStorage();
		await storage.load();
		await storage.add(SERVICE_ACCOUNT);
		expect(await getSecret(SERVICE_ACCOUNT.id)).toContain("test-private-key");

		await storage.remove(SERVICE_ACCOUNT.id);
		expect(await getSecret(SERVICE_ACCOUNT.id)).toBeNull();
		expect(storage.find(SERVICE_ACCOUNT.id)).toBeUndefined();
		expect(await Bun.file(filePath).json()).toEqual({ accounts: [], oauthClientId: null });
	});

	test("rejects an account that is already added", async () => {
		const { storage } = createStorage();
		await storage.load();
		await storage.add(EMULATOR_ACCOUNT);
		await expect(storage.add({ ...EMULATOR_ACCOUNT, id: crypto.randomUUID() })).rejects.toThrow("127.0.0.1:8080 is already added.");
		await storage.remove(EMULATOR_ACCOUNT.id);
	});

	test("skips an account whose keychain secret is missing", async () => {
		const { filePath, storage } = createStorage();
		await storage.load();
		await storage.add(SERVICE_ACCOUNT);
		await Bun.secrets.delete({ service: KEYCHAIN_SERVICE, name: SERVICE_ACCOUNT.id });

		const reloaded = createStorage(filePath).storage;
		await reloaded.load();
		expect(reloaded.list()).toEqual([]);
	});

	test("prefers the user's OAuth client, then the built-in one, and never returns a secret in the settings", async () => {
		const { storage: withoutBuiltIn } = createStorage();
		await withoutBuiltIn.load();
		expect(withoutBuiltIn.getOAuthClient()).toBeNull();
		expect(withoutBuiltIn.getOAuthClientSettings()).toEqual({ source: "none", clientId: null, hasBuiltInClient: false });

		const { filePath, storage } = createStorage(undefined, BUILT_IN_OAUTH_CLIENT);
		await storage.load();
		const builtInSettings: OAuthClientSettings = { source: "built-in", clientId: null, hasBuiltInClient: true };
		expect(storage.getOAuthClient()).toEqual({ source: "built-in", oauthClient: BUILT_IN_OAUTH_CLIENT });
		expect(storage.getOAuthClientSettings()).toEqual(builtInSettings);

		const savedSettings = await storage.setOAuthClient(OAUTH_CLIENT);
		expect(savedSettings).toEqual({ source: "user", clientId: OAUTH_CLIENT.clientId, hasBuiltInClient: true });
		expect(storage.getOAuthClient()).toEqual({ source: "user", oauthClient: OAUTH_CLIENT });

		const removedSettings = await storage.removeOAuthClient();
		expect(removedSettings).toEqual(builtInSettings);
		expect(storage.getOAuthClient()).toEqual({ source: "built-in", oauthClient: BUILT_IN_OAUTH_CLIENT });
		expect(await getSecret("oauth-client-secret")).toBeNull();
		expect(await Bun.file(filePath).json()).toEqual({ accounts: [], oauthClientId: null });

		const webviewText = JSON.stringify([savedSettings, removedSettings, storage.getOAuthClientSettings()]);
		expect(webviewText).not.toContain(OAUTH_CLIENT.clientSecret);
		expect(webviewText).not.toContain(BUILT_IN_OAUTH_CLIENT.clientSecret);
		expect(webviewText).not.toContain(BUILT_IN_OAUTH_CLIENT.clientId);
	});

	test("resolves a built-in client account with the bundled client and keeps its secret out of storage", async () => {
		const { filePath, storage } = createStorage(undefined, BUILT_IN_OAUTH_CLIENT);
		await storage.load();
		const summary = await storage.addGoogleUser(BUILT_IN_CLIENT_ACCOUNT);
		expect(summary).toEqual({ id: BUILT_IN_CLIENT_ACCOUNT.id, type: "google-user", label: BUILT_IN_CLIENT_ACCOUNT.email });
		expect(await getSecret(BUILT_IN_CLIENT_ACCOUNT.id)).not.toContain(BUILT_IN_OAUTH_CLIENT.clientSecret);
		expect(await Bun.file(filePath).text()).not.toContain(BUILT_IN_OAUTH_CLIENT.clientSecret);

		const reloaded = createStorage(filePath, BUILT_IN_OAUTH_CLIENT).storage;
		await reloaded.load();
		const account = reloaded.find(BUILT_IN_CLIENT_ACCOUNT.id) as GoogleUserAccount;
		expect(account).toEqual(BUILT_IN_CLIENT_ACCOUNT);
		expect(resolveDatabaseSettings(account, { ...DATABASE_TARGET, accountId: account.id })).toMatchObject({
			credentials: {
				client_id: BUILT_IN_OAUTH_CLIENT.clientId,
				client_secret: BUILT_IN_OAUTH_CLIENT.clientSecret,
				refresh_token: BUILT_IN_CLIENT_ACCOUNT.refreshToken,
			},
		});
		await reloaded.remove(BUILT_IN_CLIENT_ACCOUNT.id);
	});

	test("asks to sign in again when the build lacks the account's built-in client, and replaces it on sign-in", async () => {
		const { filePath, storage } = createStorage(undefined, BUILT_IN_OAUTH_CLIENT);
		await storage.load();
		await storage.addGoogleUser(BUILT_IN_CLIENT_ACCOUNT);
		const signInAgain = "Sign in again with Google to use it.";

		for (const builtInOAuthClient of [null, OTHER_BUILT_IN_OAUTH_CLIENT]) {
			const reloaded = createStorage(filePath, builtInOAuthClient).storage;
			await reloaded.load();
			expect(reloaded.list()).toEqual([{ id: BUILT_IN_CLIENT_ACCOUNT.id, type: "google-user", label: BUILT_IN_CLIENT_ACCOUNT.email }]);
			const account = reloaded.find(BUILT_IN_CLIENT_ACCOUNT.id) as GoogleUserAccount;
			expect(account.oauthClientSecret).toBeNull();
			expect(() => resolveDatabaseSettings(account, { ...DATABASE_TARGET, accountId: account.id })).toThrow(signInAgain);
			await expect(listProjects(account)).rejects.toThrow(signInAgain);
		}

		const withoutBuiltIn = createStorage(filePath).storage;
		await withoutBuiltIn.load();
		await withoutBuiltIn.setOAuthClient(OAUTH_CLIENT);
		const summary = await withoutBuiltIn.addGoogleUser({
			...BUILT_IN_CLIENT_ACCOUNT,
			id: crypto.randomUUID(),
			refreshToken: "test-new-refresh-token",
			oauthClientSource: "user",
			oauthClientId: OAUTH_CLIENT.clientId,
			oauthClientSecret: OAUTH_CLIENT.clientSecret,
		});
		expect(summary.id).toBe(BUILT_IN_CLIENT_ACCOUNT.id);

		const reloaded = createStorage(filePath).storage;
		await reloaded.load();
		expect(reloaded.list()).toEqual([summary]);
		expect(reloaded.find(BUILT_IN_CLIENT_ACCOUNT.id)).toMatchObject({
			refreshToken: "test-new-refresh-token",
			oauthClientSource: "user",
			oauthClientSecret: OAUTH_CLIENT.clientSecret,
		});
		await reloaded.remove(BUILT_IN_CLIENT_ACCOUNT.id);
		await reloaded.removeOAuthClient();
	});

	test("reads a Google user stored before client sources existed as a user client account", async () => {
		const { filePath, storage } = createStorage();
		await storage.load();
		await storage.add(GOOGLE_USER_ACCOUNT);
		const file = await Bun.file(filePath).json();
		delete file.accounts[0].oauthClientSource;
		await writeFile(filePath, JSON.stringify(file));

		const reloaded = createStorage(filePath, BUILT_IN_OAUTH_CLIENT).storage;
		await reloaded.load();
		expect(reloaded.find(GOOGLE_USER_ACCOUNT.id)).toEqual(GOOGLE_USER_ACCOUNT);
		await reloaded.remove(GOOGLE_USER_ACCOUNT.id);
	});

	test("rejects an accounts file with an invalid account", async () => {
		const { filePath, storage } = createStorage();
		await writeFile(filePath, JSON.stringify({ accounts: [{ id: "broken", type: "emulator" }], oauthClientId: null }));
		await expect(storage.load()).rejects.toThrow("The accounts file holds an invalid account broken.");
	});

	test("resolves a stored emulator account for a run-script task", async () => {
		const { filePath, storage } = createStorage();
		await storage.load();
		await storage.add(EMULATOR_ACCOUNT);
		const reloaded = createStorage(filePath).storage;
		await reloaded.load();

		const collection = `account-storage-test-${crypto.randomUUID()}`;
		const updates: TaskUpdate[] = [];
		const queue = new TaskQueue({
			workerPath: WORKER_PATH,
			concurrency: 1,
			findAccount: (accountId) => reloaded.find(accountId),
			onUpdate: (update) => updates.push(update),
			cleanUp: async () => {},
		});
		const taskId = queue.start({
			type: "run-script",
			database: { accountId: EMULATOR_ACCOUNT.id, projectId: "demo-cinder", databaseId: "(default)" },
			script: `async function run() {
	await db.doc("${collection}/greeting").set({ text: "hello" });
	return (await db.doc("${collection}/greeting").get()).get("text");
}`,
		});
		while (!updates.some((update) => update.taskId === taskId && ["done", "failed"].includes(update.status))) {
			await Bun.sleep(20);
		}

		expect(updates.at(-1)).toMatchObject({ status: "done", error: null, result: { kind: "value", value: { type: "string", value: "hello" } } });
		const db = createFirestore({ type: "emulator", projectId: "demo-cinder", databaseId: "(default)", host: "127.0.0.1", port: 8080 });
		await db.recursiveDelete(db.collection(collection));
		await db.terminate();
		await reloaded.remove(EMULATOR_ACCOUNT.id);
	});
});
