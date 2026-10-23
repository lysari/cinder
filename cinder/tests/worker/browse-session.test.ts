import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { BROWSE_SESSION_ARGUMENT } from "../../src/shared/constants/browse-session";
import type { EmulatorDatabaseSettings } from "../../src/shared/interfaces/account.interface";
import type { BrowseRequestMessage, BrowseSessionStartMessage, BrowseWorkerMessage } from "../../src/shared/interfaces/browse.interface";

const WORKER_PATH = join(import.meta.dir, "../../src/worker/index.ts");
const SETTINGS: EmulatorDatabaseSettings = { type: "emulator", projectId: "demo-cinder", databaseId: "(default)", host: "127.0.0.1", port: 8080 };
const DATABASE = { accountId: "emulator", projectId: SETTINGS.projectId, databaseId: SETTINGS.databaseId };

async function waitFor(isDone: () => boolean): Promise<void> {
	while (!isDone()) {
		await Bun.sleep(20);
	}
}

describe("browse session worker", () => {
	test("closes its live listeners and exits cleanly when it is stopped", async () => {
		const messages: BrowseWorkerMessage[] = [];
		const worker = Bun.spawn([process.execPath, WORKER_PATH, BROWSE_SESSION_ARGUMENT], {
			ipc: (message: BrowseWorkerMessage) => messages.push(message),
			serialization: "json",
			stdio: ["ignore", "inherit", "inherit"],
		});
		const startMessage: BrowseSessionStartMessage = { settings: SETTINGS };
		worker.send(startMessage);
		const listenMessage: BrowseRequestMessage = {
			requestId: 1,
			operation: {
				type: "listen",
				params: {
					listenerId: crypto.randomUUID(),
					database: DATABASE,
					query: { target: { type: "collection", collectionPath: `browse-session-test-${crypto.randomUUID()}` }, filters: [], orders: [], limit: null },
					limit: 5,
				},
			},
		};
		worker.send(listenMessage);
		await waitFor(() => messages.some((message) => "kind" in message && message.kind === "changes"));

		worker.kill();
		await worker.exited;
		expect(worker.signalCode).toBeNull();
		expect(worker.exitCode).toBe(0);
	});
});
