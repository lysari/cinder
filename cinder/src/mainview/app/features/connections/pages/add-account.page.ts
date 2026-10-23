import { NgTemplateOutlet } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { Router } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";
import type { AccountSummary, EmulatorAccountForm, OAuthClient } from "../../../../../shared/interfaces/account.interface";
import { AccountsStore } from "../../../core/stores/accounts.store";
import { errorMessage } from "../../../shared/utils/error-message";
import { EmulatorAccountFormComponent } from "../components/emulator-account-form.component";
import { OAuthClientFormComponent } from "../components/oauth-client-form.component";

@Component({
	selector: "app-add-account-page",
	imports: [NgTemplateOutlet, LucideAngularModule, EmulatorAccountFormComponent, OAuthClientFormComponent],
	templateUrl: "./add-account.page.html",
	styleUrl: "./add-account.page.scss",
})
export class AddAccountPage {
	private readonly router = inject(Router);
	protected readonly store = inject(AccountsStore);
	protected readonly accountType = signal<AccountSummary["type"]>("emulator");
	protected readonly isPending = signal(false);
	protected readonly error = signal<string | null>(null);
	protected readonly isEditingOAuthClient = signal(false);

	constructor() {
		void this.store.loadOAuthClient();
	}

	protected selectAccountType(accountType: AccountSummary["type"]): void {
		this.accountType.set(accountType);
		this.error.set(null);
	}

	protected addEmulatorAccount(form: EmulatorAccountForm): Promise<void> {
		return this.run(async () => {
			await this.store.addEmulatorAccount(form);
			await this.router.navigate(["/"]);
		});
	}

	protected importServiceAccount(): Promise<void> {
		return this.run(async () => {
			if (await this.store.importServiceAccount()) {
				await this.router.navigate(["/"]);
			}
		});
	}

	protected saveOAuthClient(oauthClient: OAuthClient): Promise<void> {
		return this.run(async () => {
			await this.store.saveOAuthClient(oauthClient);
			this.isEditingOAuthClient.set(false);
		});
	}

	protected removeOAuthClient(): Promise<void> {
		return this.run(async () => {
			await this.store.removeOAuthClient();
			this.isEditingOAuthClient.set(false);
		});
	}

	protected signInWithGoogle(): Promise<void> {
		return this.run(async () => {
			await this.store.signInWithGoogle();
			await this.router.navigate(["/"]);
		});
	}

	protected cancelGoogleSignIn(): void {
		void this.store.cancelGoogleSignIn();
	}

	private async run(action: () => Promise<void>): Promise<void> {
		this.isPending.set(true);
		this.error.set(null);
		try {
			await action();
		} catch (error) {
			this.error.set(errorMessage(error));
		} finally {
			this.isPending.set(false);
		}
	}
}
