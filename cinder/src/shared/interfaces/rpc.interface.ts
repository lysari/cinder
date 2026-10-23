import type { RPCSchema } from "electrobun/rpc";
import type { MenuAction } from "../constants/menu";
import type { AccountSummary, EmulatorAccountForm, OAuthClient, OAuthClientSettings } from "./account.interface";
import type { ViewState } from "./app-state.interface";
import type {
	BrowseResponses,
	CreateDocumentParams,
	DeleteDocumentParams,
	DocumentParams,
	ListCollectionsParams,
	ListDocumentsParams,
	SetDocumentParams,
	UpdateDocumentParams,
} from "./browse.interface";
import type { ExportFileCheck, ExportFileParams } from "./export.interface";
import type { ImportFileSummary } from "./import.interface";
import type { LiveQueryParams, LiveUpdate, StopLiveParams } from "./live.interface";
import type { Project, ProjectDatabases } from "./project.interface";
import type { CountQueryParams, RunQueryParams } from "./query.interface";
import type { TaskRequest, TaskUpdate } from "./task.interface";

interface CancelTaskParams {
	taskId: string;
}

export interface AccountParams {
	accountId: string;
}

export interface ProjectParams {
	accountId: string;
	projectId: string;
}

type BunRequests = {
	startTask: { params: TaskRequest; response: string };
	cancelTask: { params: CancelTaskParams; response: void };
	listAccounts: { params: undefined; response: AccountSummary[] };
	addEmulatorAccount: { params: EmulatorAccountForm; response: AccountSummary };
	importServiceAccount: { params: undefined; response: AccountSummary | null };
	removeAccount: { params: AccountParams; response: void };
	getOAuthClient: { params: undefined; response: OAuthClientSettings | null };
	setOAuthClient: { params: OAuthClient; response: OAuthClientSettings };
	signInWithGoogle: { params: undefined; response: AccountSummary };
	cancelGoogleSignIn: { params: undefined; response: void };
	listProjects: { params: AccountParams; response: Project[] };
	listDatabases: { params: ProjectParams; response: ProjectDatabases };
	listCollections: { params: ListCollectionsParams; response: BrowseResponses["listCollections"] };
	listDocuments: { params: ListDocumentsParams; response: BrowseResponses["listDocuments"] };
	getDocument: { params: DocumentParams; response: BrowseResponses["getDocument"] };
	createDocument: { params: CreateDocumentParams; response: BrowseResponses["createDocument"] };
	updateDocument: { params: UpdateDocumentParams; response: BrowseResponses["updateDocument"] };
	setDocument: { params: SetDocumentParams; response: BrowseResponses["setDocument"] };
	deleteDocument: { params: DeleteDocumentParams; response: void };
	runQuery: { params: RunQueryParams; response: BrowseResponses["runQuery"] };
	countQuery: { params: CountQueryParams; response: BrowseResponses["countQuery"] };
	getDefaultExportFolder: { params: undefined; response: string };
	chooseExportFolder: { params: undefined; response: string | null };
	checkExportFile: { params: ExportFileParams; response: ExportFileCheck };
	chooseImportFile: { params: undefined; response: ImportFileSummary | null };
	startLive: { params: LiveQueryParams; response: void };
	stopLive: { params: StopLiveParams; response: void };
	getViewState: { params: undefined; response: ViewState | null };
};

type BunMessages = {
	saveViewState: ViewState;
};

type WebviewMessages = {
	taskUpdated: TaskUpdate;
	liveUpdated: LiveUpdate;
	menuActionInvoked: MenuAction;
	tabOpenRequested: string;
};

export interface AppRpcSchema {
	bun: RPCSchema<{ requests: BunRequests; messages: BunMessages }>;
	webview: RPCSchema<{ messages: WebviewMessages }>;
}
