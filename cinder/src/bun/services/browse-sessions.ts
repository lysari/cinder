import type { Subprocess } from "bun";
import { BROWSE_SESSION_ARGUMENT } from "../../shared/constants/browse-session";
import type { Account, DatabaseTarget } from "../../shared/interfaces/account.interface";
import type {
	BrowseOperation,
	BrowseRequestMessage,
	BrowseResponse,
	BrowseResponseMessage,
	BrowseSessionStartMessage,
	BrowseWorkerMessage,
} from "../../shared/interfaces/browse.interface";
import type { LiveQueryParams, LiveUpdate } from "../../shared/interfaces/live.interface";
import { resolveDatabaseSettings } from "./database-settings";

export const BROWSE_REQUEST_TIMEOUT_MS = 30_000;
export const BROWSE_IDLE_TIMEOUT_MS = 5 * 60_000;

interface BrowseSessionsOptions {
	workerPath: string;
	requestTimeoutMs: number;
	idleTimeoutMs: number;
	findAccount: (accountId: string) => Account | undefined;
	onSessionEnd: (target: DatabaseTarget, reason: string) => void;
	onLiveUpdate: (update: LiveUpdate) => void;
}

interface PendingRequest {
	resolve: (result: unknown) => void;
	reject: (error: Error) => void;
	timer: Timer;
}

interface BrowseSession {
	key: string;
	target: DatabaseTarget;
	worker: Subprocess;
	pendingRequests: Map<number, PendingRequest>;
	idleTimer: Timer | null;
	closeReason: string | null;
}

export class BrowseSessions {
	private readonly sessions = new Map<string, BrowseSession>();
	private readonly listenerSessions = new Map<string, BrowseSession>();
	private nextRequestId = 1;

	constructor(private readonly options: BrowseSessionsOptions) {}

	async request<T extends BrowseOperation>(operation: T): Promise<BrowseResponse<T>> {
		return this.requestIn(this.sessionFor(operation.params.database), operation);
	}

	async startLive(params: LiveQueryParams): Promise<void> {
		if (this.listenerSessions.has(params.listenerId)) {
			throw new Error("This live view is already running.");
		}
		const session = this.sessionFor(params.database);
		this.listenerSessions.set(params.listenerId, session);
		try {
			await this.requestIn(session, { type: "listen", params });
		} catch (error) {
			this.listenerSessions.delete(params.listenerId);
			throw error;
		}
	}

	async stopLive(listenerId: string): Promise<void> {
		const session = this.listenerSessions.get(listenerId);
		if (!session) {
			return;
		}
		this.listenerSessions.delete(listenerId);
		if (session.closeReason === null) {
			await this.requestIn(session, { type: "unlisten", params: { database: session.target, listenerId } });
		}
	}

	closeAccount(accountId: string): void {
		for (const session of this.sessions.values()) {
			if (session.target.accountId === accountId) {
				this.close(session, "its account was removed");
			}
		}
	}

	closeAll(): void {
		for (const session of this.sessions.values()) {
			this.close(session, "the app quit");
		}
	}

	private requestIn<T extends BrowseOperation>(session: BrowseSession, operation: T): Promise<BrowseResponse<T>> {
		const requestId = this.nextRequestId++;
		return new Promise<BrowseResponse<T>>((resolve, reject) => {
			const timer = setTimeout(() => {
				session.pendingRequests.delete(requestId);
				this.scheduleIdleClose(session);
				reject(new Error(`Firestore did not answer within ${this.options.requestTimeoutMs / 1000} seconds.`));
			}, this.options.requestTimeoutMs);
			session.pendingRequests.set(requestId, { resolve: resolve as (result: unknown) => void, reject, timer });
			this.clearIdleTimer(session);
			const message: BrowseRequestMessage = { requestId, operation };
			session.worker.send(message);
		});
	}

	private sessionFor(target: DatabaseTarget): BrowseSession {
		const key = sessionKey(target);
		const existingSession = this.sessions.get(key);
		if (existingSession) {
			return existingSession;
		}
		const account = this.options.findAccount(target.accountId);
		if (!account) {
			throw new Error(`Account ${target.accountId} was not found.`);
		}
		const worker = Bun.spawn([process.execPath, this.options.workerPath, BROWSE_SESSION_ARGUMENT], {
			ipc: (message: BrowseWorkerMessage) =>
				"requestId" in message ? this.handleResponse(session, message) : this.handleLiveUpdate(session, message),
			serialization: "json",
			stdio: ["ignore", "inherit", "inherit"],
		});
		const session: BrowseSession = { key, target, worker, pendingRequests: new Map(), idleTimer: null, closeReason: null };
		this.sessions.set(key, session);
		const startMessage: BrowseSessionStartMessage = { settings: resolveDatabaseSettings(account, target) };
		worker.send(startMessage);
		void worker.exited.then(() => this.handleExit(session));
		return session;
	}

	private handleResponse(session: BrowseSession, response: BrowseResponseMessage): void {
		const pendingRequest = session.pendingRequests.get(response.requestId);
		if (!pendingRequest) {
			return;
		}
		clearTimeout(pendingRequest.timer);
		session.pendingRequests.delete(response.requestId);
		if (response.error === null) {
			pendingRequest.resolve(response.result);
		} else {
			pendingRequest.reject(new Error(response.error));
		}
		this.scheduleIdleClose(session);
	}

	private handleLiveUpdate(session: BrowseSession, update: LiveUpdate): void {
		if (this.listenerSessions.get(update.listenerId) !== session) {
			return;
		}
		if (update.kind === "stopped") {
			this.listenerSessions.delete(update.listenerId);
		}
		this.options.onLiveUpdate(update);
	}

	private handleExit(session: BrowseSession): void {
		if (this.sessions.get(session.key) === session) {
			this.sessions.delete(session.key);
		}
		this.clearIdleTimer(session);
		const reason = session.closeReason ?? describeExit(session.worker);
		for (const pendingRequest of session.pendingRequests.values()) {
			clearTimeout(pendingRequest.timer);
			pendingRequest.reject(new Error(`The browse session stopped because ${reason}. Try again.`));
		}
		session.pendingRequests.clear();
		for (const [listenerId, listenerSession] of this.listenerSessions) {
			if (listenerSession === session) {
				this.listenerSessions.delete(listenerId);
				this.options.onLiveUpdate({ listenerId, kind: "stopped", reason: `The browse session stopped because ${reason}.` });
			}
		}
		this.options.onSessionEnd(session.target, reason);
	}

	private scheduleIdleClose(session: BrowseSession): void {
		if (session.pendingRequests.size > 0 || session.closeReason !== null) {
			return;
		}
		this.clearIdleTimer(session);
		session.idleTimer = setTimeout(() => this.close(session, "it was idle"), this.options.idleTimeoutMs);
	}

	private clearIdleTimer(session: BrowseSession): void {
		if (session.idleTimer) {
			clearTimeout(session.idleTimer);
			session.idleTimer = null;
		}
	}

	private close(session: BrowseSession, reason: string): void {
		session.closeReason = reason;
		this.sessions.delete(session.key);
		this.clearIdleTimer(session);
		session.worker.kill();
	}
}

function sessionKey({ accountId, projectId, databaseId }: DatabaseTarget): string {
	return JSON.stringify([accountId, projectId, databaseId]);
}

function describeExit(worker: Subprocess): string {
	if (worker.signalCode) {
		return `its process was stopped by ${worker.signalCode}`;
	}
	return `its process exited with code ${worker.exitCode}`;
}
