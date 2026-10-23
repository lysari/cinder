import type { TaskProgress, TaskRequest } from "../../../../shared/interfaces/task.interface";
import type { Task } from "../interfaces/task.interface";

const BYTES_PER_KILOBYTE = 1024;
const BYTE_UNITS = ["bytes", "KB", "MB", "GB", "TB"];

/** Returns how far a task has come, from 0 to 1, or null when its total is not known (a script, a preview, or work that includes subcollections). */
export function taskProgressRatio({ status, request, progress }: Task): number | null {
	if (status === "done") {
		return 1;
	}
	const [done, total] = doneAndTotal(request.type, progress);
	if (request.type === "run-script" || total === null || total === 0) {
		return null;
	}
	return Math.min(done / total, 1);
}

/** Formats a byte count for people, e.g. 1536 becomes "1.5 KB". */
export function formatByteCount(byteCount: number): string {
	let value = byteCount;
	let unitIndex = 0;
	while (value >= BYTES_PER_KILOBYTE && unitIndex < BYTE_UNITS.length - 1) {
		value /= BYTES_PER_KILOBYTE;
		unitIndex += 1;
	}
	return unitIndex === 0 ? `${value} bytes` : `${value.toFixed(1)} ${BYTE_UNITS[unitIndex]}`;
}

function doneAndTotal(type: TaskRequest["type"], progress: TaskProgress): [number, number | null] {
	switch (type) {
		case "export":
		case "bulk-update":
		case "copy":
			return [progress.reads, progress.totalDocuments];
		case "delete-collection":
			return [progress.deletes, progress.totalDocuments];
		default:
			return [progress.bytes, progress.totalBytes];
	}
}
