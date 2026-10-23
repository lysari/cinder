import Electrobun, { ApplicationMenu, BrowserView, BrowserWindow, PATHS, Screen, Utils } from "electrobun/main";
import { join, relative } from "node:path";
import { MENU_ACTIONS } from "../shared/constants/menu";
import type { Account, OAuthClient } from "../shared/interfaces/account.interface";
import type { WindowFrame } from "../shared/interfaces/app-state.interface";
import type { AppRpcSchema } from "../shared/interfaces/rpc.interface";
import {
	parseAccountParams,
	parseEmulatorAccountForm,
	parseOAuthClient,
	parseProjectParams,
} from "./account-request-parser";
import {
	parseCountQueryParams,
	parseCreateDocumentParams,
	parseDeleteDocumentParams,
	parseDocumentParams,
	parseListCollectionsParams,
	parseListDocumentsParams,
	parseLiveQueryParams,
	parseRunQueryParams,
	parseSetDocumentParams,
	parseStopLiveParams,
	parseUpdateDocumentParams,
	requireObject,
} from "./browse-request-parser";
import { EXPORT_FORMATS, IMPORT_FILE_EXTENSIONS } from "../shared/constants/data-transfer";
import { AccountStorage } from "./services/account-storage";
import { APP_STATE_SAVE_DELAY_MS, AppStateStorage } from "./services/app-state-storage";
import { BROWSE_IDLE_TIMEOUT_MS, BROWSE_REQUEST_TIMEOUT_MS, BrowseSessions } from "./services/browse-sessions";
import { checkExportFile, removeExportLeftovers, requireWritableExportFile } from "./services/export-file";
import { FileAccess } from "./services/file-access";
import { GoogleSignIn, SIGN_IN_TIMEOUT_MS } from "./services/google-sign-in";
import { summarizeImportFile } from "./services/import-file";
import { listDatabases, listProjects } from "./services/project-listing";
import { readServiceAccountKey } from "./services/service-account-key";
import { TASK_CONCURRENCY, TaskQueue } from "./services/task-queue";
import { parseTaskRequest } from "./task-request-parser";
import { parseViewState, parseWindowFrame, tabUrlOfLink } from "./view-state-parser";

declare const BUILT_IN_OAUTH_CLIENT: OAuthClient | null;

const DEFAULT_WINDOW_SIZE = { width: 1280, height: 800 };

const accountStorage = new AccountStorage({
	filePath: join(Utils.paths.userData, "accounts.json"),
	keychainService: relative(Utils.paths.appData, Utils.paths.userData),
	builtInOAuthClient: BUILT_IN_OAUTH_CLIENT,
});
await accountStorage.load();

const appState = new AppStateStorage({
	filePath: join(Utils.paths.userData, "app-state.json"),
	saveDelayMs: APP_STATE_SAVE_DELAY_MS,
});
await appState.load();

const fileAccess = new FileAccess();
fileAccess.allowFolder(Utils.paths.downloads);

const googleSignIn = new GoogleSignIn({ timeoutMs: SIGN_IN_TIMEOUT_MS, openUrl: Utils.openExternal });

function requireAccount(accountId: string): Account {
	const account = accountStorage.find(accountId);
	if (!account) {
		throw new Error(`Account ${accountId} was not found.`);
	}
	return account;
}

function isOnScreen(frame: WindowFrame): boolean {
	return Screen.getAllDisplays().some(
		({ workArea }) =>
			frame.x < workArea.x + workArea.width &&
			frame.x + frame.width > workArea.x &&
			frame.y < workArea.y + workArea.height &&
			frame.y + frame.height > workArea.y,
	);
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
		submenu: [
			{ label: "Command Palette…", action: "command-palette", accelerator: "CommandOrControl+K" },
			{ type: "separator" },
			{ role: "toggleFullScreen" },
		],
	},
	{
		label: "Tab",
		submenu: [
			{ label: "New Tab", action: "new-tab", accelerator: "CommandOrControl+T" },
			{ label: "Close Tab", action: "close-tab", accelerator: "CommandOrControl+W" },
			{ type: "separator" },
			{ label: "Show Previous Tab", action: "previous-tab", accelerator: "CommandOrControl+Shift+[" },
			{ label: "Show Next Tab", action: "next-tab", accelerator: "CommandOrControl+Shift+]" },
		],
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
	cleanUp: async (taskId, request) => {
		try {
			await removeExportLeftovers(taskId, request);
		} catch (error) {
			console.error(`Removing the partial export of task ${taskId} failed: ${String(error)}`);
		}
	},
});

const browseSessions = new BrowseSessions({
	workerPath,
	requestTimeoutMs: BROWSE_REQUEST_TIMEOUT_MS,
	idleTimeoutMs: BROWSE_IDLE_TIMEOUT_MS,
	findAccount: (accountId) => accountStorage.find(accountId),
	onSessionEnd: ({ projectId, databaseId }, reason) =>
		console.info(`Browse session for ${projectId}/${databaseId} ended because ${reason}.`),
	onLiveUpdate: (update) => rpc.send.liveUpdated(update),
});
Electrobun.events.on("before-quit", () => {
	browseSessions.closeAll();
	appState.flush();
});

const rpc = BrowserView.defineRPC<AppRpcSchema>({
	handlers: {
		requests: {
			startTask: async (params) => {
				const request = parseTaskRequest(params, fileAccess);
				if (request.type === "export") {
					await requireWritableExportFile(request, fileAccess);
				}
				return taskQueue.start(request);
			},
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
			removeOAuthClient: () => accountStorage.removeOAuthClient(),
			signInWithGoogle: async () => {
				const activeClient = accountStorage.getOAuthClient();
				if (!activeClient) {
					throw new Error("Save your OAuth client before signing in with Google.");
				}
				const { source, oauthClient } = activeClient;
				const { email, refreshToken } = await googleSignIn.start(oauthClient);
				const summary = await accountStorage.addGoogleUser({
					id: crypto.randomUUID(),
					type: "google-user",
					email,
					refreshToken,
					oauthClientSource: source,
					oauthClientId: oauthClient.clientId,
					oauthClientSecret: oauthClient.clientSecret,
				});
				browseSessions.closeAccount(summary.id);
				return summary;
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
			runQuery: (params) => browseSessions.request({ type: "runQuery", params: parseRunQueryParams(params) }),
			countQuery: (params) => browseSessions.request({ type: "countQuery", params: parseCountQueryParams(params) }),
			getDefaultExportFolder: () => Utils.paths.downloads,
			chooseExportFolder: async () => {
				const [folderPath] = await Utils.openFileDialog({
					startingFolder: Utils.paths.downloads,
					canChooseFiles: false,
					canChooseDirectory: true,
					allowsMultipleSelection: false,
				});
				if (!folderPath) {
					return null;
				}
				fileAccess.allowFolder(folderPath);
				return folderPath;
			},
			checkExportFile: (params) => {
				const { folderPath, fileName, format } = requireObject(params);
				const exportFormat = EXPORT_FORMATS.find((candidate) => candidate === format);
				if (typeof folderPath !== "string" || typeof fileName !== "string" || !exportFormat) {
					throw new Error("The export needs a folder, a file name and a format.");
				}
				return checkExportFile({ folderPath, fileName, format: exportFormat }, fileAccess);
			},
			chooseImportFile: async () => {
				const [filePath] = await Utils.openFileDialog({
					startingFolder: Utils.paths.downloads,
					allowedFileTypes: IMPORT_FILE_EXTENSIONS.join(","),
					canChooseFiles: true,
					canChooseDirectory: false,
					allowsMultipleSelection: false,
				});
				if (!filePath) {
					return null;
				}
				fileAccess.allowFile(filePath);
				return summarizeImportFile(filePath);
			},
			startLive: (params) => browseSessions.startLive(parseLiveQueryParams(params)),
			stopLive: (params) => browseSessions.stopLive(parseStopLiveParams(params).listenerId),
			getViewState: () => appState.viewState,
		},
		messages: {
			saveViewState: (view) => {
				try {
					appState.saveViewState(parseViewState(view));
				} catch (error) {
					console.warn(`The view state was not saved: ${String(error)}`);
				}
			},
		},
	},
});

ApplicationMenu.on("application-menu-clicked", (event) => {
	const { action } = (event as { data: { action: string } }).data;
	const menuAction = MENU_ACTIONS.find((candidate) => candidate === action);
	if (menuAction) {
		rpc.send.menuActionInvoked(menuAction);
	}
});

const savedFrame = appState.windowFrame;
const mainWindow = new BrowserWindow({
	title: "Cinder",
	url: "views://mainview/index.html",
	rpc,
	frame: DEFAULT_WINDOW_SIZE,
	hidden: savedFrame !== null,
});
if (savedFrame) {
	if (isOnScreen(savedFrame)) {
		mainWindow.setFrame(savedFrame.x, savedFrame.y, savedFrame.width, savedFrame.height);
	} else {
		mainWindow.setSize(savedFrame.width, savedFrame.height);
		mainWindow.center();
	}
	mainWindow.show();
}

function saveWindowFrame(): void {
	if (mainWindow.isFullScreen() || mainWindow.isMinimized()) {
		return;
	}
	const { x, y, width, height } = mainWindow.getFrame();
	const frame = { x: Math.round(x), y: Math.round(y), width: Math.round(width), height: Math.round(height) };
	try {
		appState.saveWindowFrame(parseWindowFrame(frame));
	} catch (error) {
		console.warn(`The window frame was not saved: ${String(error)}`);
	}
}
Electrobun.events.on("new-window-open", (event: { data: { detail: unknown } }) => {
	const tabUrl = tabUrlOfLink(event.data.detail);
	if (tabUrl) {
		rpc.send.tabOpenRequested(tabUrl);
	}
});
mainWindow.on("resize", saveWindowFrame);
mainWindow.on("move", saveWindowFrame);
