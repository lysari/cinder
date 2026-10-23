import { afterAll, describe, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readServiceAccountKey } from "../../../src/bun/services/service-account-key";

const KEY = {
	type: "service_account",
	project_id: "key-project",
	private_key_id: "test-key-id",
	private_key: "-----BEGIN PRIVATE KEY-----\ntest-private-key\n-----END PRIVATE KEY-----\n",
	client_email: "reader@key-project.iam.gserviceaccount.com",
};
const temporaryDirectory = await mkdtemp(join(tmpdir(), "cinder-service-account-key-"));

async function writeKeyFile(contents: string): Promise<string> {
	const path = join(temporaryDirectory, `${crypto.randomUUID()}.json`);
	await writeFile(path, contents);
	return path;
}

afterAll(() => rm(temporaryDirectory, { recursive: true, force: true }));

describe("readServiceAccountKey", () => {
	test("reads the project, client email and private key of a key file", async () => {
		expect(await readServiceAccountKey(await writeKeyFile(JSON.stringify(KEY)))).toEqual({
			projectId: "key-project",
			clientEmail: KEY.client_email,
			privateKey: KEY.private_key,
		});
	});

	test("rejects a file that is not JSON", async () => {
		await expect(readServiceAccountKey(await writeKeyFile("not json"))).rejects.toThrow("The file is not a JSON service account key.");
	});

	test("rejects a JSON file of another credential type", async () => {
		const path = await writeKeyFile(JSON.stringify({ ...KEY, type: "authorized_user" }));
		await expect(readServiceAccountKey(path)).rejects.toThrow("its type must be service_account");
	});

	test("rejects a key without a project, client email or private key", async () => {
		await expect(readServiceAccountKey(await writeKeyFile(JSON.stringify({ ...KEY, project_id: "" })))).rejects.toThrow(
			"The service account key has no valid project_id.",
		);
		await expect(readServiceAccountKey(await writeKeyFile(JSON.stringify({ ...KEY, client_email: "reader" })))).rejects.toThrow(
			"The service account key has no valid client_email.",
		);
		await expect(readServiceAccountKey(await writeKeyFile(JSON.stringify({ ...KEY, private_key: "test" })))).rejects.toThrow(
			"The service account key has no valid private_key.",
		);
	});

	test("rejects a file larger than a key can be", async () => {
		const path = await writeKeyFile(JSON.stringify({ ...KEY, padding: "x".repeat(20 * 1024) }));
		await expect(readServiceAccountKey(path)).rejects.toThrow("The file is too large to be a service account key.");
	});
});
