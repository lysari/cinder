import { afterAll, describe, expect, spyOn, test } from "bun:test";
import { mkdtemp, readdir, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AppStateStorage } from "../../../src/bun/services/app-state-storage";
import type { ViewState, WindowFrame } from "../../../src/shared/interfaces/app-state.interface";

const folder = await mkdtemp(join(tmpdir(), "cinder-app-state-"));
const SAVE_DELAY_MS = 50;
const FRAME: WindowFrame = { x: 40, y: 60, width: 1100, height: 700 };
const VIEW: ViewState = {
	tabs: [
		{ id: "tab-1", url: "/" },
		{ id: "tab-2", url: "/query/a/demo-cinder/(default)" },
	],
	activeTabId: "tab-2",
	sidebarExpandedIds: ["a"],
	documentView: "tree",
	queryPages: [
		{
			tabId: "tab-2",
			database: { accountId: "a", projectId: "demo-cinder", databaseId: "(default)" },
			collectionPath: null,
			mode: "javascript",
			form: { targetType: "collection", targetPath: "users", filters: [], orders: [], limitText: "100" },
			script: "async function run() {\n  return 1;\n}\n",
		},
	],
};

let fileCount = 0;
function newFilePath(): string {
	return join(folder, `state-${++fileCount}`, "app-state.json");
}

afterAll(async () => {
	await rm(folder, { recursive: true, force: true });
});

describe("AppStateStorage", () => {
	test("starts empty without a file and writes nothing until a save", async () => {
		const filePath = newFilePath();
		const storage = new AppStateStorage({ filePath, saveDelayMs: SAVE_DELAY_MS });
		await storage.load();
		expect(storage.windowFrame).toBeNull();
		expect(storage.viewState).toBeNull();
		storage.flush();
		expect(await Bun.file(filePath).exists()).toBe(false);
	});

	test("debounces saves into one atomic write with mode 0600 that loads back", async () => {
		const filePath = newFilePath();
		const storage = new AppStateStorage({ filePath, saveDelayMs: SAVE_DELAY_MS });
		storage.saveWindowFrame({ ...FRAME, width: 900 });
		storage.saveWindowFrame(FRAME);
		storage.saveViewState(VIEW);
		expect(await Bun.file(filePath).exists()).toBe(false);
		await Bun.sleep(SAVE_DELAY_MS * 3);
		expect((await stat(filePath)).mode & 0o777).toBe(0o600);
		expect(await readdir(join(filePath, ".."))).toEqual(["app-state.json"]);

		const reloaded = new AppStateStorage({ filePath, saveDelayMs: SAVE_DELAY_MS });
		await reloaded.load();
		expect(reloaded.windowFrame).toEqual(FRAME);
		expect(reloaded.viewState).toEqual(VIEW);
	});

	test("restarts the delay on every save and writes at once on flush", async () => {
		const filePath = newFilePath();
		const storage = new AppStateStorage({ filePath, saveDelayMs: SAVE_DELAY_MS });
		storage.saveWindowFrame(FRAME);
		await Bun.sleep(SAVE_DELAY_MS / 2);
		storage.saveViewState(VIEW);
		await Bun.sleep(SAVE_DELAY_MS * 0.75);
		expect(await Bun.file(filePath).exists()).toBe(false);
		storage.flush();
		expect(JSON.parse(await Bun.file(filePath).text())).toEqual({ version: 1, window: FRAME, view: VIEW });
	});

	test("ignores a corrupt or invalid file with a warning and replaces it on the next save", async () => {
		const warn = spyOn(console, "warn").mockImplementation(() => undefined);
		const corruptPath = newFilePath();
		const invalidPath = newFilePath();
		await Bun.write(corruptPath, "{ not json");
		await Bun.write(invalidPath, JSON.stringify({ version: 1, window: FRAME, view: { ...VIEW, activeTabId: "missing" } }));
		for (const filePath of [corruptPath, invalidPath]) {
			const storage = new AppStateStorage({ filePath, saveDelayMs: SAVE_DELAY_MS });
			await storage.load();
			expect(storage.windowFrame).toBeNull();
			expect(storage.viewState).toBeNull();
		}
		expect(warn).toHaveBeenCalledTimes(2);
		expect(String(warn.mock.calls[1][0])).toContain("The active tab is not one of the tabs.");
		warn.mockRestore();

		const storage = new AppStateStorage({ filePath: corruptPath, saveDelayMs: SAVE_DELAY_MS });
		storage.saveViewState(VIEW);
		storage.flush();
		expect(JSON.parse(await Bun.file(corruptPath).text()).view).toEqual(VIEW);
	});
});
