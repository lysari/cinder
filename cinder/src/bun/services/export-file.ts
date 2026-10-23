import { rm, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import type { ExportFileCheck, ExportFileParams, ExportTaskRequest } from "../../shared/interfaces/export.interface";
import type { TaskRequest } from "../../shared/interfaces/task.interface";
import { exportFileNameError, exportPartialFileName, exportSpoolFileName } from "../../shared/utils/export-file-name";
import type { FileAccess } from "./file-access";

export async function checkExportFile({ folderPath, fileName, format }: ExportFileParams, fileAccess: FileAccess): Promise<ExportFileCheck> {
	const folder = fileAccess.requireFolder(folderPath);
	const nameError = exportFileNameError(fileName, format);
	if (nameError) {
		throw new Error(nameError);
	}
	const filePath = resolve(folder, fileName);
	if (dirname(filePath) !== folder) {
		throw new Error("The file must be inside the chosen folder.");
	}
	const folderStats = await stat(folder).catch(() => null);
	if (!folderStats?.isDirectory()) {
		throw new Error("The chosen folder no longer exists.");
	}
	return { filePath, isExisting: await Bun.file(filePath).exists() };
}

export async function requireWritableExportFile(request: ExportTaskRequest, fileAccess: FileAccess): Promise<void> {
	const { isExisting } = await checkExportFile(request, fileAccess);
	if (isExisting && !request.isOverwriting) {
		throw new Error(`${request.fileName} already exists. Confirm that it may be replaced.`);
	}
}

export async function removeExportLeftovers(taskId: string, request: TaskRequest): Promise<void> {
	if (request.type !== "export") {
		return;
	}
	const { folderPath, fileName } = request;
	await rm(join(folderPath, exportPartialFileName(fileName, taskId)), { force: true });
	await rm(join(folderPath, exportSpoolFileName(fileName, taskId)), { force: true });
}
