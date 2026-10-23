import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { summarizeImportFile } from "../../../src/bun/services/import-file";

let folderPath = "";

async function fileWith(name: string, text: string): Promise<string> {
	const filePath = join(folderPath, name);
	await Bun.write(filePath, text);
	return filePath;
}

beforeAll(async () => {
	folderPath = await mkdtemp(join(tmpdir(), "cinder-import-file-test-"));
});

afterAll(async () => {
	await rm(folderPath, { recursive: true, force: true });
});

describe("summarizeImportFile", () => {
	test("recognizes a Cinder JSON export from its header", async () => {
		const filePath = await fileWith(
			"users.json",
			`{\n\t"format": "cinder-json",\n\t"version": 1,\n\t"exportedAt": "2026-10-23T00:00:00.000Z",\n\t"rootPath": "users",\n\t"documents": [\n`,
		);
		expect(await summarizeImportFile(filePath)).toEqual({
			filePath,
			fileName: "users.json",
			byteCount: Bun.file(filePath).size,
			format: "cinder-json",
			rootPath: "users",
			exportedAt: "2026-10-23T00:00:00.000Z",
		});
	});

	test("reads plain JSON, CSV and Cinder NDJSON by extension and content", async () => {
		expect((await summarizeImportFile(await fileWith("plain.json", '﻿[{"a":1}]'))).format).toBe("json");
		expect((await summarizeImportFile(await fileWith("people.tsv", "a\tb\n"))).format).toBe("csv");
		const ndjson = await summarizeImportFile(await fileWith("tree.jsonl", `${JSON.stringify({ format: "cinder-ndjson", version: 1, rootPath: null })}\n{}`));
		expect(ndjson).toMatchObject({ format: "ndjson", rootPath: null });
	});

	test("rejects files that are neither", async () => {
		await expect(summarizeImportFile(await fileWith("notes.json", "hello"))).rejects.toThrow("The file is not JSON, NDJSON or CSV.");
		await expect(summarizeImportFile(await fileWith("lines.ndjson", '{"a":1}\n'))).rejects.toThrow("The file is not a cinder-ndjson export.");
	});
});
