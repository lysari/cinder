import { Component, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";
import { AccountsStore } from "../../../core/stores/accounts.store";
import { EmptyStateComponent } from "../components/empty-state.component";

@Component({
	selector: "app-explorer-start-page",
	imports: [RouterLink, LucideAngularModule, EmptyStateComponent],
	templateUrl: "./explorer-start.page.html",
	styleUrl: "./explorer-start.page.scss",
})
export class ExplorerStartPage {
	protected readonly store = inject(AccountsStore);
}
