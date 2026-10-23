import type { Subprocess } from "bun";
import { totalmem } from "node:os";
import { EMPTY_TASK_PROGRESS } from "../../shared/constants/task";
import type { Account, DatabaseTarget } from "../../shared/interfaces/account.interface";
import type {
	TaskProgress,
	TaskRequest,
	TaskStatus,
	TaskUpdate,
	WorkerTaskMessage,
} from "../../shared/interfaces/task.interface";
import { isSameDatabase } from "../../shared/utils/copy-validation";
import { resolveDatabaseSettings } from "./database-settings";

const HIGH_MEMORY_BYTES = 10 * 1024 ** 3;


export const TASK_CONCURRENCY = totalmem() > HIGH_MEMORY_BYTES ? 4 : 2;

interface TaskQueueOptions {
	workerPath: string;
	concurrency: number;
	findAccount: (accountId: string) => Account | undefined;
	onUpdate: (update: TaskUpdate) => void;
	cleanUp: (taskId: string, request: TaskRequest) => Promise<void>;
}

interface QueuedTask {
	taskId: string;
	request: TaskRequest;
}

interface RunningTask {
	taskId: string;
	request: TaskRequest;
	worker: Subprocess;
	progress: TaskProgress;
	isCanceled: boolean;
	hasEnded: boolean;
	isDone: boolean;
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
		const destination = destinationOf(request);
		const destinationAccount = destination === null ? null : this.options.findAccount(destination.accountId);
		if (!account || destinationAccount === undefined) {
			const missingAccountId = account ? destination?.accountId : request.database.accountId;
			this.report(taskId, "failed", `Account ${missingAccountId} was not found.`);
			return;
		}
		const worker = Bun.spawn([process.execPath, this.options.workerPath], {
			ipc: (update: TaskUpdate) => this.handleUpdate(runningTask, update),
			serialization: "json",
			stdio: ["ignore", "inherit", "inherit"],
		});
		const runningTask: RunningTask = {
			taskId,
			request,
			worker,
			progress: EMPTY_TASK_PROGRESS,
			isCanceled: false,
			hasEnded: false,
			isDone: false,
		};
		this.runningTasks.set(taskId, runningTask);
		const message: WorkerTaskMessage = {
			taskId,
			request,
			settings: resolveDatabaseSettings(account, request.database),
			destinationSettings: destination && destinationAccount ? resolveDatabaseSettings(destinationAccount, destination) : null,
		};
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
		runningTask.isDone = update.status === "done";
		this.options.onUpdate({ ...update, taskId: runningTask.taskId });
	}

	private async handleExit(runningTask: RunningTask): Promise<void> {
		if (!runningTask.isDone) {
			await this.options.cleanUp(runningTask.taskId, runningTask.request);
		}
		if (runningTask.isCanceled) {
			this.report(runningTask.taskId, "canceled", null);
		} else if (!runningTask.hasEnded) {
			this.report(runningTask.taskId, "failed", describeExit(runningTask.worker));
		}
		this.runningTasks.delete(runningTask.taskId);
		this.startNextTasks();
	}

	private report(taskId: string, status: TaskStatus, error: string | null): void {
		const progress = this.runningTasks.get(taskId)?.progress ?? EMPTY_TASK_PROGRESS;
		this.options.onUpdate({ taskId, status, progress, logEntries: [], result: null, error });
	}
}

function destinationOf(request: TaskRequest): DatabaseTarget | null {
	if (request.type !== "copy" || isSameDatabase(request.database, request.destination.database)) {
		return null;
	}
	return request.destination.database;
}

function describeExit(worker: Subprocess): string {
	if (worker.signalCode) {
		return `The task process was stopped by ${worker.signalCode}; it most likely ran out of memory.`;
	}
	return `The task process exited with code ${worker.exitCode} before finishing.`;
}
