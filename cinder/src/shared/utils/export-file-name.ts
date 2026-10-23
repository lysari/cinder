import { EXPORT_FILE_EXTENSIONS, type ExportFormat, MAX_FILE_NAME_BYTES } from "../constants/data-transfer";

const FORBIDDEN_CHARACTER_PATTERN = /[/\\:\p{Cc}]/u;
const textEncoder = new TextEncoder();

/** Checks an export file name typed by the user: no folders, no "..", no leading dot, and an extension that fits the format. Returns the problem or null. */
export function exportFileNameError(fileName: string, format: ExportFormat): string | null {
	if (fileName.trim().length === 0) {
		return "Enter a file name.";
	}
	if (FORBIDDEN_CHARACTER_PATTERN.test(fileName)) {
		return "A file name cannot contain /, \\, : or control characters.";
	}
	if (fileName.startsWith(".") || fileName.includes("..")) {
		return 'A file name cannot start with a dot or contain "..".';
	}
	if (textEncoder.encode(fileName).length > MAX_FILE_NAME_BYTES) {
		return `A file name can be at most ${MAX_FILE_NAME_BYTES} bytes long.`;
	}
	const extensions = EXPORT_FILE_EXTENSIONS[format];
	if (!extensions.some((extension) => fileName.toLowerCase().endsWith(extension))) {
		return `End the file name with ${extensions.join(" or ")}.`;
	}
	return null;
}

/** Names the hidden file an export writes before it is complete, next to the final file. Pass the final name and the task id. */
export function exportPartialFileName(fileName: string, taskId: string): string {
	return `.${fileName}.${taskId}.partial`;
}

/** Names the hidden file a CSV export collects its rows in before it knows every column. Pass the final name and the task id. */
export function exportSpoolFileName(fileName: string, taskId: string): string {
	return `.${fileName}.${taskId}.spool`;
}
