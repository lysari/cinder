import { afterAll, describe, expect, test } from "bun:test";
import { mkdtemp, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AccountStorage } from "../../../src/bun/services/account-storage";
import { TaskQueue } from "../../../src/bun/services/task-queue";
import type { EmulatorAccount, GoogleUserAccount, ServiceAccount } from "../../../src/shared/interfaces/account.interface";
import type { TaskUpdate } from "../../../src/shared/interfaces/task.interface";
import { createFirestore } from "../../../src/worker/firestore-client";

const KEYCHAIN_SERVICE = `app.cinder.desktop.test-${crypto.randomUUID()}`;
const OAUTH_CLIENT = { clientId: "test-client.apps.googleusercontent.com", clientSecret: "test-oauth-client-secret" };
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
	oauthClient: { clientId: "older-client.apps.googleusercontent.com", clientSecret: "test-older-client-secret" },
};
const WORKER_PATH = join(import.meta.dir, "../../../src/worker/index.ts");
const temporaryDirectory = await mkdtemp(join(tmpdir(), "cinder-account-storage-"));
let fileCount = 0;

function createStorage(filePath = join(temporaryDirectory, `accounts-${++fileCount}.json`)) {
	return { filePath, storage: new AccountStorage({ filePath, keychainService: KEYCHAIN_SERVICE }) };
}

function getSecret(name: string) {
	return Bun.secrets.get({ service: KEYCHAIN_SERVICE, name });
}

afterAll(async () => {
	for (const name of [EMULATOR_ACCOUNT.id, SERVICE_ACCOUNT.id, GOOGLE_USER_ACCOUNT.id, "oauth-client-secret"]) {
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
		expect(reloaded.getOAuthClient()).toEqual(OAUTH_CLIENT);
		expect(reloaded.getOAuthClientSettings()).toEqual({ clientId: OAUTH_CLIENT.clientId });
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
			GOOGLE_USER_ACCOUNT.oauthClient.clientSecret,
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
