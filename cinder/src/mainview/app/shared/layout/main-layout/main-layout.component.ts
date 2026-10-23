import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { SidebarComponent } from "./sidebar/sidebar.component";
import { StatusbarComponent } from "./statusbar/statusbar.component";

@Component({
	selector: "app-main-layout",
	imports: [RouterOutlet, SidebarComponent, StatusbarComponent],
	templateUrl: "./main-layout.component.html",
	styleUrl: "./main-layout.component.scss",
})
export class MainLayoutComponent {}
