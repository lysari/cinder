import { Injectable, effect, inject, signal } from "@angular/core";
import type { DatabaseTarget } from "../../../../../shared/interfaces/account.interface";
import { AccountsStore } from "../../../core/stores/accounts.store";
import { CollectionsStore } from "../../../core/stores/collections.store";
import { ViewStateStore } from "../../../core/stores/view-state.store";

@Injectable()
export class SidebarStore {
	private readonly accounts = inject(AccountsStore);
	private readonly collections = inject(CollectionsStore);
	private readonly viewState = inject(ViewStateStore);
	private readonly expandedIds = signal<ReadonlySet<string>>(new Set(this.viewState.sidebarExpandedIds()));

	constructor() {
		effect(() => this.viewState.sidebarExpandedIds.set([...this.expandedIds()]));
	}

	async loadExpanded(): Promise<void> {
		await this.accounts.loadAccounts();
		const accounts = this.accounts.accounts();
		const expandedAccounts = accounts.status === "loaded" ? accounts.value.filter(({ id }) => this.isAccountExpanded(id)) : [];
		await Promise.all(expandedAccounts.map(({ id }) => this.loadExpandedProjects(id)));
	}

	isAccountExpanded(accountId: string): boolean {
		return this.expandedIds().has(accountId);
	}

	isProjectExpanded(accountId: string, projectId: string): boolean {
		return this.expandedIds().has(projectKey(accountId, projectId));
	}

	isDatabaseExpanded(database: DatabaseTarget): boolean {
		return this.expandedIds().has(databaseKey(database));
	}

	toggleAccount(accountId: string): void {
		if (this.toggle(accountId)) {
			void this.accounts.loadProjects(accountId);
		}
	}

	toggleProject(accountId: string, projectId: string): void {
		if (this.toggle(projectKey(accountId, projectId))) {
			void this.accounts.loadDatabases(accountId, projectId);
		}
	}

	toggleDatabase(database: DatabaseTarget): void {
		if (this.toggle(databaseKey(database))) {
			void this.collections.loadRootCollections(database);
		}
	}

	expandAccount(accountId: string): Promise<void> {
		this.expand(accountId);
		return this.accounts.loadProjects(accountId);
	}

	expandProject(accountId: string, projectId: string): Promise<void> {
		this.expand(accountId);
		this.expand(projectKey(accountId, projectId));
		return this.accounts.loadDatabases(accountId, projectId);
	}

	expandDatabase(database: DatabaseTarget): Promise<void> {
		this.expand(database.accountId);
		this.expand(projectKey(database.accountId, database.projectId));
		this.expand(databaseKey(database));
		return this.collections.loadRootCollections(database);
	}

	private async loadExpandedProjects(accountId: string): Promise<void> {
		await this.accounts.loadProjects(accountId);
		const projects = this.accounts.projectsOf(accountId);
		const expandedProjects =
			projects?.status === "loaded" ? projects.value.filter(({ projectId }) => this.isProjectExpanded(accountId, projectId)) : [];
		await Promise.all(expandedProjects.map(({ projectId }) => this.loadExpandedDatabases(accountId, projectId)));
	}

	private async loadExpandedDatabases(accountId: string, projectId: string): Promise<void> {
		await this.accounts.loadDatabases(accountId, projectId);
		const databases = this.accounts.databasesOf(accountId, projectId);
		const databaseIds = databases?.status === "loaded" ? databases.value.databaseIds : [];
		await Promise.all(
			databaseIds
				.map((databaseId) => ({ accountId, projectId, databaseId }))
				.filter((database) => this.isDatabaseExpanded(database))
				.map((database) => this.collections.loadRootCollections(database)),
		);
	}

	private expand(id: string): void {
		if (!this.expandedIds().has(id)) {
			this.expandedIds.update((ids) => new Set([...ids, id]));
		}
	}

	private toggle(id: string): boolean {
		const expandedIds = new Set(this.expandedIds());
		const isExpanding = !expandedIds.delete(id);
		if (isExpanding) {
			expandedIds.add(id);
		}
		this.expandedIds.set(expandedIds);
		return isExpanding;
	}
}

function projectKey(accountId: string, projectId: string): string {
	return `${accountId}/${projectId}`;
}

function databaseKey({ accountId, projectId, databaseId }: DatabaseTarget): string {
	return JSON.stringify([accountId, projectId, databaseId]);
}
