import { Component, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { RouterOutlet } from "@angular/router";
import { RpcService } from "../../../core/services/rpc.service";
import { TabsStore } from "../../../core/stores/tabs.store";
import { CommandPaletteComponent } from "./command-palette/command-palette.component";
import { SidebarComponent } from "./sidebar/sidebar.component";
import { SidebarStore } from "./sidebar.store";
import { StatusbarComponent } from "./statusbar/statusbar.component";
import { TabStripComponent } from "./tab-strip/tab-strip.component";

@Component({
	selector: "app-main-layout",
	imports: [RouterOutlet, CommandPaletteComponent, SidebarComponent, StatusbarComponent, TabStripComponent],
	providers: [SidebarStore],
	templateUrl: "./main-layout.component.html",
	styleUrl: "./main-layout.component.scss",
})
export class MainLayoutComponent {
	private readonly tabs = inject(TabsStore);
	protected readonly isPaletteOpen = signal(false);

	constructor() {
		const rpc = inject(RpcService);
		rpc.tabOpenRequests.pipe(takeUntilDestroyed()).subscribe((url) => this.tabs.openInNewTab(url, false));
		rpc.menuActions
			.pipe(takeUntilDestroyed())
			.subscribe((action) => {
				switch (action) {
					case "new-tab":
						this.tabs.newTab();
						break;
					case "close-tab":
						this.tabs.closeActive();
						break;
					case "previous-tab":
						this.tabs.activatePrevious();
						break;
					case "next-tab":
						this.tabs.activateNext();
						break;
					case "command-palette":
						this.isPaletteOpen.set(true);
						break;
				}
			});
	}
}
