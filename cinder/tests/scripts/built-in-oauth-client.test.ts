import { afterAll, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readBuiltInOAuthClient } from "../../scripts/built-in-oauth-client";

const CLIENT = { clientId: "123-fake.apps.googleusercontent.com", clientSecret: "test-fake-secret" };
const temporaryDirectory = await mkdtemp(join(tmpdir(), "cinder-built-in-oauth-client-"));
let fileCount = 0;

async function writeClientFile(text: string): Promise<string> {
	const filePath = join(temporaryDirectory, `client-${++fileCount}.json`);
	await Bun.write(filePath, text);
	return filePath;
}

afterAll(async () => {
	await rm(temporaryDirectory, { recursive: true, force: true });
});

describe("readBuiltInOAuthClient", () => {
	test("returns null when the file is absent", async () => {
		expect(await readBuiltInOAuthClient(join(temporaryDirectory, "missing.json"))).toBeNull();
	});

	test("returns the client id and secret of a valid file", async () => {
		const filePath = await writeClientFile(JSON.stringify({ ...CLIENT, note: "ignored" }));
		expect(await readBuiltInOAuthClient(filePath)).toEqual(CLIENT);
	});

	test("rejects a file that is not JSON without echoing its contents", async () => {
		const filePath = await writeClientFile(`{ "clientId": "${CLIENT.clientId}", "clientSecret": ${CLIENT.clientSecret} }`);
		const error = await readBuiltInOAuthClient(filePath).catch((caught: Error) => caught);
		expect(error).toBeInstanceOf(Error);
		expect((error as Error).message).toBe(
			`${filePath} is not valid JSON. Copy google-oauth-client.example.json and fill in your client.`,
		);
	});

	test("rejects a client id that is not a Google OAuth client id", async () => {
		const filePath = await writeClientFile(JSON.stringify({ ...CLIENT, clientId: "123-fake.example.com" }));
		await expect(readBuiltInOAuthClient(filePath)).rejects.toThrow(
			`${filePath} does not hold a valid Google OAuth client: The client id must end with .apps.googleusercontent.com.`,
		);
	});

	test("rejects an empty client secret", async () => {
		const filePath = await writeClientFile(JSON.stringify({ ...CLIENT, clientSecret: "" }));
		await expect(readBuiltInOAuthClient(filePath)).rejects.toThrow("The client secret is missing or too long.");
	});

	test("rejects the committed example until its placeholders are replaced", async () => {
		await expect(readBuiltInOAuthClient(join(import.meta.dir, "../../google-oauth-client.example.json"))).rejects.toThrow(
			"The client id must end with .apps.googleusercontent.com.",
		);
	});
});
