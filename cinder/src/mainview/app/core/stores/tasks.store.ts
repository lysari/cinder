import { Injectable, computed, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { EMPTY_TASK_PROGRESS } from "../../../../shared/constants/task";
import type { TaskRequest, TaskStatus, TaskUpdate } from "../../../../shared/interfaces/task.interface";
import type { Task } from "../interfaces/task.interface";
import { RpcService } from "../services/rpc.service";

const ENDED_STATUSES: readonly TaskStatus[] = ["done", "failed", "canceled"];

@Injectable({ providedIn: "root" })
export class TasksStore {
	private readonly rpc = inject(RpcService);
	private readonly taskList = signal<Task[]>([]);
	private startingTaskCount = 0;
	private unclaimedUpdates: TaskUpdate[] = [];
	readonly tasks = this.taskList.asReadonly();
	readonly activeTasks = computed(() => this.taskList().filter((task) => !isEnded(task.status)));

	constructor() {
		this.rpc.taskUpdates.pipe(takeUntilDestroyed()).subscribe((update) => this.receiveUpdate(update));
	}

	async start(request: TaskRequest, description: string): Promise<string> {
		this.startingTaskCount += 1;
		try {
			const taskId = await this.rpc.request.startTask(request);
			const task: Task = {
				id: taskId,
				description,
				request,
				status: "queued",
				progress: { ...EMPTY_TASK_PROGRESS },
				logEntries: [],
				result: null,
				error: null,
				startedAt: Date.now(),
				endedAt: null,
			};
			this.taskList.update((tasks) => [task, ...tasks]);
			for (const update of this.unclaimedUpdates.filter((candidate) => candidate.taskId === taskId)) {
				this.applyUpdate(update);
			}
			return taskId;
		} finally {
			this.startingTaskCount -= 1;
			if (this.startingTaskCount === 0) {
				this.unclaimedUpdates = [];
			}
		}
	}

	taskOf(taskId: string): Task | undefined {
		return this.taskList().find((task) => task.id === taskId);
	}

	cancel(taskId: string): Promise<void> {
		return this.rpc.request.cancelTask({ taskId });
	}

	private receiveUpdate(update: TaskUpdate): void {
		if (this.taskOf(update.taskId)) {
			this.applyUpdate(update);
		} else if (this.startingTaskCount > 0) {
			this.unclaimedUpdates.push(update);
		}
	}

	private applyUpdate(update: TaskUpdate): void {
		this.taskList.update((tasks) => tasks.map((task) => (task.id === update.taskId ? withUpdate(task, update) : task)));
	}
}

function withUpdate(task: Task, update: TaskUpdate): Task {
	if (isEnded(task.status)) {
		return task;
	}
	return {
		...task,
		status: update.status,
		progress: update.progress,
		endedAt: isEnded(update.status) ? Date.now() : null,
		logEntries: update.logEntries.length > 0 ? [...task.logEntries, ...update.logEntries] : task.logEntries,
		result: update.result ?? task.result,
		error: update.error ?? task.error,
	};
}

function isEnded(status: TaskStatus): boolean {
	return ENDED_STATUSES.includes(status);
}
