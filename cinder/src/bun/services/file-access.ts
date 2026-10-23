import { resolve } from "node:path";

export class FileAccess {
	private readonly folders = new Set<string>();
	private readonly files = new Set<string>();

	allowFolder(folderPath: string): void {
		this.folders.add(resolve(folderPath));
	}

	allowFile(filePath: string): void {
		this.files.add(resolve(filePath));
	}

	requireFolder(folderPath: unknown): string {
		if (typeof folderPath !== "string" || !this.folders.has(resolve(folderPath))) {
			throw new Error("Choose the folder again; Cinder only writes to folders you picked.");
		}
		return resolve(folderPath);
	}

	requireFile(filePath: unknown): string {
		if (typeof filePath !== "string" || !this.files.has(resolve(filePath))) {
			throw new Error("Choose the file again; Cinder only reads files you picked.");
		}
		return resolve(filePath);
	}
}
