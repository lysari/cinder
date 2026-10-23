import { Injectable, inject, signal } from "@angular/core";
import type {
	AccountSummary,
	EmulatorAccountForm,
	OAuthClient,
	OAuthClientSettings,
} from "../../../../shared/interfaces/account.interface";
import type { Project, ProjectDatabases } from "../../../../shared/interfaces/project.interface";
import type { Loadable } from "../../shared/interfaces/loadable.interface";
import { load } from "../../shared/utils/load";
import { RpcService } from "../services/rpc.service";

const WAIT_FOR_USER = { maxRequestTime: Infinity };

@Injectable({ providedIn: "root" })
export class AccountsStore {
	private readonly rpc = inject(RpcService);
	private readonly projects = signal<Record<string, Loadable<Project[]>>>({});
	private readonly databases = signal<Record<string, Loadable<ProjectDatabases>>>({});
	readonly accounts = signal<Loadable<AccountSummary[]>>({ status: "loading" });
	readonly oauthClient = signal<Loadable<OAuthClientSettings | null>>({ status: "loading" });
	readonly isSigningIn = signal(false);

	async loadAccounts(): Promise<void> {
		this.accounts.set(await load(() => this.rpc.request.listAccounts()));
	}

	async addEmulatorAccount(form: EmulatorAccountForm): Promise<void> {
		this.addToList(await this.rpc.request.addEmulatorAccount(form));
	}

	async importServiceAccount(): Promise<boolean> {
		const account = await this.rpc.request.importServiceAccount(undefined, WAIT_FOR_USER);
		if (account) {
			this.addToList(account);
		}
		return account !== null;
	}

	async signInWithGoogle(): Promise<void> {
		this.isSigningIn.set(true);
		try {
			this.addToList(await this.rpc.request.signInWithGoogle(undefined, WAIT_FOR_USER));
		} finally {
			this.isSigningIn.set(false);
		}
	}

	cancelGoogleSignIn(): Promise<void> {
		return this.rpc.request.cancelGoogleSignIn();
	}

	async removeAccount(accountId: string): Promise<void> {
		await this.rpc.request.removeAccount({ accountId });
		this.accounts.update((accounts) =>
			accounts.status === "loaded" ? { ...accounts, value: accounts.value.filter((account) => account.id !== accountId) } : accounts,
		);
		this.projects.update((projects) => withoutKeys(projects, (key) => key === accountId));
		this.databases.update((databases) => withoutKeys(databases, (key) => key.startsWith(databasesKey(accountId, ""))));
	}

	labelOf(accountId: string): string {
		const accounts = this.accounts();
		const account = accounts.status === "loaded" ? accounts.value.find(({ id }) => id === accountId) : undefined;
		return account?.label ?? accountId;
	}

	projectsOf(accountId: string): Loadable<Project[]> | undefined {
		return this.projects()[accountId];
	}

	async loadProjects(accountId: string): Promise<void> {
		if (this.projectsOf(accountId)?.status === "loaded") {
			return;
		}
		this.projects.update((projects) => ({ ...projects, [accountId]: { status: "loading" } }));
		const projects = await load(() => this.rpc.request.listProjects({ accountId }));
		this.projects.update((current) => ({ ...current, [accountId]: projects }));
	}

	databasesOf(accountId: string, projectId: string): Loadable<ProjectDatabases> | undefined {
		return this.databases()[databasesKey(accountId, projectId)];
	}

	async loadDatabases(accountId: string, projectId: string): Promise<void> {
		const key = databasesKey(accountId, projectId);
		if (this.databases()[key]?.status === "loaded") {
			return;
		}
		this.databases.update((databases) => ({ ...databases, [key]: { status: "loading" } }));
		const databases = await load(() => this.rpc.request.listDatabases({ accountId, projectId }));
		this.databases.update((current) => ({ ...current, [key]: databases }));
	}

	async loadOAuthClient(): Promise<void> {
		this.oauthClient.set(await load(() => this.rpc.request.getOAuthClient()));
	}

	async saveOAuthClient(oauthClient: OAuthClient): Promise<void> {
		this.oauthClient.set({ status: "loaded", value: await this.rpc.request.setOAuthClient(oauthClient) });
	}

	private addToList(account: AccountSummary): void {
		this.accounts.update((accounts) =>
			accounts.status === "loaded" ? { ...accounts, value: [...accounts.value, account] } : accounts,
		);
	}
}

function databasesKey(accountId: string, projectId: string): string {
	return `${accountId}/${projectId}`;
}

function withoutKeys<T>(entries: Record<string, T>, isRemoved: (key: string) => boolean): Record<string, T> {
	return Object.fromEntries(Object.entries(entries).filter(([key]) => !isRemoved(key)));
}
