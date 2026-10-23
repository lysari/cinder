import type { Subprocess } from "bun";
import { totalmem } from "node:os";
import type { Account } from "../../shared/interfaces/account.interface";
import type {
	TaskProgress,
	TaskRequest,
	TaskStatus,
	TaskUpdate,
	WorkerTaskMessage,
} from "../../shared/interfaces/task.interface";
import { resolveDatabaseSettings } from "./database-settings";

const HIGH_MEMORY_BYTES = 10 * 1024 ** 3;
const EMPTY_PROGRESS: TaskProgress = { reads: 0, writes: 0, deletes: 0 };

export const TASK_CONCURRENCY = totalmem() > HIGH_MEMORY_BYTES ? 4 : 2;

interface TaskQueueOptions {
	workerPath: string;
	concurrency: number;
	findAccount: (accountId: string) => Account | undefined;
	onUpdate: (update: TaskUpdate) => void;
}

interface QueuedTask {
	taskId: string;
	request: TaskRequest;
}

interface RunningTask {
	taskId: string;
	worker: Subprocess;
	progress: TaskProgress;
	isCanceled: boolean;
	hasEnded: boolean;
}

export class TaskQueue {
	private readonly queuedTasks: QueuedTask[] = [];
	private readonly runningTasks = new Map<string, RunningTask>();

	constructor(private readonly options: TaskQueueOptions) {}

	start(request: TaskRequest): string {
		const taskId = crypto.randomUUID();
		this.queuedTasks.push({ taskId, request });
		this.report(taskId, "queued", null);
		this.startNextTasks();
		return taskId;
	}

	cancel(taskId: string): void {
		const queuedIndex = this.queuedTasks.findIndex((task) => task.taskId === taskId);
		if (queuedIndex >= 0) {
			this.queuedTasks.splice(queuedIndex, 1);
			this.report(taskId, "canceled", null);
			return;
		}
		const runningTask = this.runningTasks.get(taskId);
		if (runningTask && !runningTask.hasEnded) {
			runningTask.isCanceled = true;
			runningTask.worker.kill("SIGKILL");
		}
	}

	private startNextTasks(): void {
		while (this.runningTasks.size < this.options.concurrency && this.queuedTasks.length > 0) {
			this.spawnWorker(this.queuedTasks.shift() as QueuedTask);
		}
	}

	private spawnWorker({ taskId, request }: QueuedTask): void {
		const account = this.options.findAccount(request.database.accountId);
		if (!account) {
			this.report(taskId, "failed", `Account ${request.database.accountId} was not found.`);
			return;
		}
		const worker = Bun.spawn([process.execPath, this.options.workerPath], {
			ipc: (update: TaskUpdate) => this.handleUpdate(runningTask, update),
			serialization: "json",
			stdio: ["ignore", "inherit", "inherit"],
		});
		const runningTask: RunningTask = { taskId, worker, progress: EMPTY_PROGRESS, isCanceled: false, hasEnded: false };
		this.runningTasks.set(taskId, runningTask);
		const message: WorkerTaskMessage = { taskId, request, settings: resolveDatabaseSettings(account, request.database) };
		worker.send(message);
		this.report(taskId, "running", null);
		void worker.exited.then(() => this.handleExit(runningTask));
	}

	private handleUpdate(runningTask: RunningTask, update: TaskUpdate): void {
		if (runningTask.isCanceled) {
			return;
		}
		runningTask.progress = update.progress;
		runningTask.hasEnded = update.status === "done" || update.status === "failed";
		this.options.onUpdate({ ...update, taskId: runningTask.taskId });
	}

	private handleExit(runningTask: RunningTask): void {
		if (runningTask.isCanceled) {
			this.report(runningTask.taskId, "canceled", null);
		} else if (!runningTask.hasEnded) {
			this.report(runningTask.taskId, "failed", describeExit(runningTask.worker));
		}
		this.runningTasks.delete(runningTask.taskId);
		this.startNextTasks();
	}

	private report(taskId: string, status: TaskStatus, error: string | null): void {
		const progress = this.runningTasks.get(taskId)?.progress ?? EMPTY_PROGRESS;
		this.options.onUpdate({ taskId, status, progress, logEntries: [], result: null, error });
	}
}

function describeExit(worker: Subprocess): string {
	if (worker.signalCode) {
		return `The task process was stopped by ${worker.signalCode}; it most likely ran out of memory.`;
	}
	return `The task process exited with code ${worker.exitCode} before finishing.`;
}
