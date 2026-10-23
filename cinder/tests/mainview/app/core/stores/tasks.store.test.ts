import "@angular/compiler";
import { type EnvironmentInjector, Injector } from "@angular/core";
import { describe, expect, mock, test } from "bun:test";
import { Subject } from "rxjs";
import { EMPTY_TASK_PROGRESS } from "../../../../../src/shared/constants/task";
import type { TaskRequest, TaskUpdate } from "../../../../../src/shared/interfaces/task.interface";

mock.module("electrobun/view", () => ({ Electroview: class {} }));

const { RpcService } = await import("../../../../../src/mainview/app/core/services/rpc.service");
const { TasksStore } = await import("../../../../../src/mainview/app/core/stores/tasks.store");

const REQUEST: TaskRequest = { type: "run-script", database: { accountId: "a", projectId: "p", databaseId: "(default)" }, script: "" };

function update(taskId: string, changes: Partial<TaskUpdate>): TaskUpdate {
	return { taskId, status: "running", progress: { ...EMPTY_TASK_PROGRESS }, logEntries: [], result: null, error: null, ...changes };
}

function createStore(startTask: (request: TaskRequest) => Promise<string>) {
	const taskUpdates = new Subject<TaskUpdate>();
	const canceledTaskIds: string[] = [];
	const rpc = {
		taskUpdates,
		request: {
			startTask,
			cancelTask: async ({ taskId }: { taskId: string }) => {
				canceledTaskIds.push(taskId);
			},
		},
	};
	const injector = Injector.create({ providers: [{ provide: RpcService, useValue: rpc }, TasksStore] }) as EnvironmentInjector;
	return { store: injector.get(TasksStore), taskUpdates, canceledTaskIds };
}

describe("TasksStore", () => {
	test("applies updates that arrive before startTask returns the task id", async () => {
		let finishStart: (taskId: string) => void = () => undefined;
		const { store, taskUpdates } = createStore(() => new Promise((resolve) => (finishStart = resolve)));
		const started = store.start(REQUEST, "Script");
		taskUpdates.next(update("task-1", { status: "queued" }));
		taskUpdates.next(update("task-1", { status: "running", logEntries: [{ level: "log", message: "early", time: "t" }] }));
		finishStart("task-1");
		expect(await started).toBe("task-1");
		expect(store.taskOf("task-1")).toMatchObject({ description: "Script", status: "running", logEntries: [{ message: "early" }] });
		expect(store.activeTasks()).toHaveLength(1);
	});

	test("keeps several tasks apart, newest first, and ignores updates after a task ended", async () => {
		let nextId = 0;
		const { store, taskUpdates, canceledTaskIds } = createStore(async () => `task-${++nextId}`);
		await store.start(REQUEST, "First");
		await store.start(REQUEST, "Second");
		taskUpdates.next(update("task-1", { progress: { ...EMPTY_TASK_PROGRESS, writes: 5 } }));
		taskUpdates.next(update("task-2", { status: "done", result: { kind: "value", value: { type: "null" } } }));
		taskUpdates.next(update("task-2", { status: "running" }));
		taskUpdates.next(update("unknown", { status: "done" }));
		expect(store.tasks().map((task) => [task.description, task.status])).toEqual([
			["Second", "done"],
			["First", "running"],
		]);
		expect(store.taskOf("task-1")?.progress.writes).toBe(5);
		expect(store.taskOf("task-2")?.endedAt).not.toBeNull();
		expect(store.activeTasks().map((task) => task.id)).toEqual(["task-1"]);
		await store.cancel("task-1");
		expect(canceledTaskIds).toEqual(["task-1"]);
	});

	test("adds no task when the main process rejects the start", async () => {
		const { store, taskUpdates } = createStore(async () => {
			throw new Error("The query cannot run: x");
		});
		const started = store.start(REQUEST, "Broken");
		taskUpdates.next(update("orphan", { status: "queued" }));
		await expect(started).rejects.toThrow("The query cannot run: x");
		expect(store.tasks()).toEqual([]);
	});
});
