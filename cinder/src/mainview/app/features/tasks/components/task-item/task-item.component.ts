import { DatePipe } from "@angular/common";
import { Component, computed, effect, input, output, signal } from "@angular/core";
import { LucideAngularModule } from "lucide-angular";
import type { TaskStatus } from "../../../../../../shared/interfaces/task.interface";
import type { Task } from "../../../../core/interfaces/task.interface";
import { formatByteCount, taskProgressRatio } from "../../../../core/utils/task-progress";

const STATUS_LABELS: Record<TaskStatus, string> = {
	queued: "Queued",
	running: "Running",
	done: "Done",
	failed: "Failed",
	canceled: "Canceled",
};

@Component({
	selector: "app-task-item",
	imports: [DatePipe, LucideAngularModule],
	templateUrl: "./task-item.component.html",
	styleUrl: "./task-item.component.scss",
})
export class TaskItemComponent {
	readonly task = input.required<Task>();
	readonly isHighlighted = input(false);
	readonly cancelRequested = output<void>();
	protected readonly statusLabels = STATUS_LABELS;
	protected readonly isLogOpen = signal(false);
	protected readonly isActive = computed(() => this.task().status === "queued" || this.task().status === "running");
	protected readonly progressRatio = computed(() => taskProgressRatio(this.task()));
	protected readonly cancelNote = computed(() => {
		const { request } = this.task();
		switch (request.type) {
			case "import":
			case "load-csv":
				return "documents written before the cancel stay in Firestore.";
			case "bulk-update":
				return request.isDryRun ? null : "documents updated before the cancel keep the change.";
			case "copy":
				return request.isMove
					? "documents moved before the cancel stay moved, the rest stay at the source; one copied right before the cancel can exist in both places."
					: "documents copied before the cancel stay in the destination.";
			case "delete-collection":
				return "documents deleted before the cancel stay deleted.";
			default:
				return null;
		}
	});
	protected readonly counts = computed(() => {
		const { request, progress } = this.task();
		const bytesRead = progress.totalBytes === null ? "" : `${formatByteCount(progress.bytes)} of ${formatByteCount(progress.totalBytes)} read`;
		const documentsRead = `${progress.reads}${progress.totalDocuments === null ? "" : ` of ${progress.totalDocuments}`} documents read`;
		switch (request.type) {
			case "export":
				return `${documentsRead}, ${formatByteCount(progress.bytes)} written`;
			case "import":
			case "load-csv":
				return `${progress.writes} written, ${progress.skips} skipped, ${progress.failures} failed${bytesRead ? `, ${bytesRead}` : ""}`;
			case "analyze-csv":
				return bytesRead;
			case "run-script":
				return `${this.task().logEntries.length} log lines`;
			case "bulk-update":
				return request.isDryRun
					? `${progress.reads} documents read for the preview`
					: `${documentsRead}, ${progress.writes} updated, ${progress.skips} unchanged, ${progress.failures} failed`;
			case "copy":
				return `${documentsRead}, ${progress.writes} written, ${progress.skips} skipped, ${request.isMove ? `${progress.deletes} sources deleted, ` : ""}${progress.failures} failed`;
			case "delete-collection":
				return `${progress.deletes}${progress.totalDocuments === null ? "" : ` of ${progress.totalDocuments}`} documents deleted, ${progress.failures} failed`;
		}
	});
	protected readonly writeSummary = computed(() => {
		const { request, result } = this.task();
		if (result?.kind !== "writes") {
			return null;
		}
		const { writeCount, skipCount, deleteCount, failureCount } = result;
		switch (request.type) {
			case "bulk-update":
				return `${writeCount} documents updated, ${skipCount} unchanged, ${failureCount} failed.`;
			case "copy":
				if (!request.isMove) {
					return `${writeCount} documents copied, ${skipCount} skipped because they already existed, ${failureCount} failed.`;
				}
				return [
					`${deleteCount} documents moved, ${skipCount} skipped and left at the source, ${failureCount} failed.`,
					writeCount > deleteCount ? `${writeCount - deleteCount} documents were copied but their source could not be deleted, so they now exist in both places.` : "",
					failureCount > 0 ? "A document that could not be copied stays at the source." : "",
				].filter((sentence) => sentence.length > 0).join(" ");
			case "delete-collection":
				return `${deleteCount} documents deleted, ${failureCount} failed.`;
			default:
				return `${writeCount} written, ${skipCount} skipped, ${failureCount} failed.`;
		}
	});
	protected readonly hiddenFailureCount = computed(() => {
		const { result } = this.task();
		return result?.kind === "writes" ? result.failureCount - result.failures.length : 0;
	});

	constructor() {
		effect(() => {
			if (this.isHighlighted()) {
				this.isLogOpen.set(true);
			}
		});
	}

	protected formatBytes(byteCount: number): string {
		return formatByteCount(byteCount);
	}
}
