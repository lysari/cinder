import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkExportFile, removeExportLeftovers, requireWritableExportFile } from "../../../src/bun/services/export-file";
import { FileAccess } from "../../../src/bun/services/file-access";
import type { ExportTaskRequest } from "../../../src/shared/interfaces/export.interface";

let folderPath = "";
const fileAccess = new FileAccess();

function exportRequest(fileName: string, isOverwriting: boolean): ExportTaskRequest {
	return {
		type: "export",
		database: { accountId: "a", projectId: "p", databaseId: "(default)" },
		source: { type: "collection", collectionPath: "users", isRecursive: false },
		format: "csv",
		folderPath,
		fileName,
		isOverwriting,
	};
}

beforeAll(async () => {
	folderPath = await mkdtemp(join(tmpdir(), "cinder-export-file-test-"));
	fileAccess.allowFolder(folderPath);
	await Bun.write(join(folderPath, "taken.csv"), "x");
});

afterAll(async () => {
	await rm(folderPath, { recursive: true, force: true });
});

describe("checkExportFile", () => {
	test("resolves the file inside the chosen folder and says whether it exists", async () => {
		expect(await checkExportFile({ folderPath, fileName: "new.csv", format: "csv" }, fileAccess)).toEqual({
			filePath: join(folderPath, "new.csv"),
			isExisting: false,
		});
		expect((await checkExportFile({ folderPath, fileName: "taken.csv", format: "csv" }, fileAccess)).isExisting).toBe(true);
	});

	test("rejects traversal and folders the user did not pick", async () => {
		await expect(checkExportFile({ folderPath, fileName: "../escape.csv", format: "csv" }, fileAccess)).rejects.toThrow(
			"A file name cannot contain /",
		);
		await expect(checkExportFile({ folderPath: join(folderPath, ".."), fileName: "a.csv", format: "csv" }, fileAccess)).rejects.toThrow(
			"Choose the folder again",
		);
	});

	test("asks to confirm before replacing an existing file", async () => {
		await expect(requireWritableExportFile(exportRequest("taken.csv", false), fileAccess)).rejects.toThrow(
			"taken.csv already exists. Confirm that it may be replaced.",
		);
		await requireWritableExportFile(exportRequest("taken.csv", true), fileAccess);
		await requireWritableExportFile(exportRequest("free.csv", false), fileAccess);
	});
});

describe("removeExportLeftovers", () => {
	test("deletes only the partial and spool files of that task", async () => {
		await Bun.write(join(folderPath, ".out.csv.task-1.partial"), "x");
		await Bun.write(join(folderPath, ".out.csv.task-1.spool"), "x");
		await Bun.write(join(folderPath, ".out.csv.task-2.partial"), "x");
		await removeExportLeftovers("task-1", exportRequest("out.csv", false));
		expect((await readdir(folderPath)).sort()).toEqual([".out.csv.task-2.partial", "taken.csv"]);
	});
});
