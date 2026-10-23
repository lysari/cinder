import { Component, inject } from "@angular/core";
import { AccountsStore } from "../../../../core/stores/accounts.store";

@Component({
	selector: "app-statusbar",
	templateUrl: "./statusbar.component.html",
	styleUrl: "./statusbar.component.scss",
})
export class StatusbarComponent {
	protected readonly accountsStore = inject(AccountsStore);
}
