import Electrobun, { ApplicationMenu, BrowserView, BrowserWindow, PATHS, Utils } from "electrobun/main";
import { join, relative } from "node:path";
import type { Account } from "../shared/interfaces/account.interface";
import type { AppRpcSchema } from "../shared/interfaces/rpc.interface";
import {
	parseAccountParams,
	parseEmulatorAccountForm,
	parseOAuthClient,
	parseProjectParams,
} from "./account-request-parser";
import {
	parseCreateDocumentParams,
	parseDeleteDocumentParams,
	parseDocumentParams,
	parseListCollectionsParams,
	parseListDocumentsParams,
	parseSetDocumentParams,
	parseUpdateDocumentParams,
} from "./browse-request-parser";
import { AccountStorage } from "./services/account-storage";
import { BROWSE_IDLE_TIMEOUT_MS, BROWSE_REQUEST_TIMEOUT_MS, BrowseSessions } from "./services/browse-sessions";
import { GoogleSignIn, SIGN_IN_TIMEOUT_MS } from "./services/google-sign-in";
import { listDatabases, listProjects } from "./services/project-listing";
import { readServiceAccountKey } from "./services/service-account-key";
import { TASK_CONCURRENCY, TaskQueue } from "./services/task-queue";
import { parseTaskRequest } from "./task-request-parser";

const accountStorage = new AccountStorage({
	filePath: join(Utils.paths.userData, "accounts.json"),
	keychainService: relative(Utils.paths.appData, Utils.paths.userData),
});
await accountStorage.load();

const googleSignIn = new GoogleSignIn({ timeoutMs: SIGN_IN_TIMEOUT_MS, openUrl: Utils.openExternal });

function requireAccount(accountId: string): Account {
	const account = accountStorage.find(accountId);
	if (!account) {
		throw new Error(`Account ${accountId} was not found.`);
	}
	return account;
}

ApplicationMenu.setApplicationMenu([
	{
		label: "Cinder",
		submenu: [
			{ role: "about" },
			{ type: "separator" },
			{ role: "hide" },
			{ role: "hideOthers" },
			{ role: "showAll" },
			{ type: "separator" },
			{ role: "quit" },
		],
	},
	{
		label: "Edit",
		submenu: [
			{ role: "undo" },
			{ role: "redo" },
			{ type: "separator" },
			{ role: "cut" },
			{ role: "copy" },
			{ role: "paste" },
			{ role: "pasteAndMatchStyle" },
			{ role: "delete" },
			{ role: "selectAll" },
		],
	},
	{
		label: "View",
		submenu: [{ role: "toggleFullScreen" }],
	},
	{
		label: "Window",
		submenu: [
			{ role: "minimize" },
			{ role: "zoom" },
			{ type: "separator" },
			{ role: "close" },
		],
	},
]);

const workerPath = join(PATHS.RESOURCES_FOLDER, "app", "bun", "worker.js");

const taskQueue = new TaskQueue({
	workerPath,
	concurrency: TASK_CONCURRENCY,
	findAccount: (accountId) => accountStorage.find(accountId),
	onUpdate: (update) => rpc.send.taskUpdated(update),
});

const browseSessions = new BrowseSessions({
	workerPath,
	requestTimeoutMs: BROWSE_REQUEST_TIMEOUT_MS,
	idleTimeoutMs: BROWSE_IDLE_TIMEOUT_MS,
	findAccount: (accountId) => accountStorage.find(accountId),
	onSessionEnd: ({ projectId, databaseId }, reason) =>
		console.info(`Browse session for ${projectId}/${databaseId} ended because ${reason}.`),
});
Electrobun.events.on("before-quit", () => browseSessions.closeAll());

const rpc = BrowserView.defineRPC<AppRpcSchema>({
	handlers: {
		requests: {
			startTask: (request) => taskQueue.start(parseTaskRequest(request)),
			cancelTask: ({ taskId }) => taskQueue.cancel(taskId),
			listAccounts: () => accountStorage.list(),
			addEmulatorAccount: (params) =>
				accountStorage.add({ id: crypto.randomUUID(), type: "emulator", ...parseEmulatorAccountForm(params) }),
			importServiceAccount: async () => {
				const [path] = await Utils.openFileDialog({
					allowedFileTypes: "json",
					canChooseFiles: true,
					canChooseDirectory: false,
					allowsMultipleSelection: false,
				});
				if (!path) {
					return null;
				}
				const key = await readServiceAccountKey(path);
				return accountStorage.add({ id: crypto.randomUUID(), type: "service-account", ...key });
			},
			removeAccount: async (params) => {
				const { accountId } = parseAccountParams(params);
				await accountStorage.remove(accountId);
				browseSessions.closeAccount(accountId);
			},
			getOAuthClient: () => accountStorage.getOAuthClientSettings(),
			setOAuthClient: (params) => accountStorage.setOAuthClient(parseOAuthClient(params)),
			signInWithGoogle: async () => {
				const oauthClient = accountStorage.getOAuthClient();
				if (!oauthClient) {
					throw new Error("Save your OAuth client before signing in with Google.");
				}
				const { email, refreshToken } = await googleSignIn.start(oauthClient);
				return accountStorage.add({ id: crypto.randomUUID(), type: "google-user", email, refreshToken, oauthClient });
			},
			cancelGoogleSignIn: () => googleSignIn.cancel(),
			listProjects: (params) => listProjects(requireAccount(parseAccountParams(params).accountId)),
			listDatabases: (params) => {
				const { accountId, projectId } = parseProjectParams(params);
				return listDatabases(requireAccount(accountId), projectId);
			},
			listCollections: (params) =>
				browseSessions.request({ type: "listCollections", params: parseListCollectionsParams(params) }),
			listDocuments: (params) => browseSessions.request({ type: "listDocuments", params: parseListDocumentsParams(params) }),
			getDocument: (params) => browseSessions.request({ type: "getDocument", params: parseDocumentParams(params) }),
			createDocument: (params) =>
				browseSessions.request({ type: "createDocument", params: parseCreateDocumentParams(params) }),
			updateDocument: (params) =>
				browseSessions.request({ type: "updateDocument", params: parseUpdateDocumentParams(params) }),
			setDocument: (params) => browseSessions.request({ type: "setDocument", params: parseSetDocumentParams(params) }),
			deleteDocument: async (params) => {
				await browseSessions.request({ type: "deleteDocument", params: parseDeleteDocumentParams(params) });
			},
		},
	},
});

new BrowserWindow({
	title: "Cinder",
	url: "views://mainview/index.html",
	rpc,
	frame: {
		width: 1280,
		height: 800,
	},
});
