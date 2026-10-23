import { Component, input, output } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import {
	OAUTH_CLIENT_ID_PATTERN,
	OAUTH_CLIENT_SECRET_MAX_LENGTH,
} from "../../../../../../shared/constants/account-validation";
import type { OAuthClient } from "../../../../../../shared/interfaces/account.interface";

@Component({
	selector: "app-oauth-client-form",
	imports: [ReactiveFormsModule],
	templateUrl: "./oauth-client-form.component.html",
	styleUrl: "./oauth-client-form.component.scss",
})
export class OAuthClientFormComponent {
	readonly isPending = input(false);
	readonly canCancel = input(false);
	readonly saved = output<OAuthClient>();
	readonly canceled = output<void>();
	protected readonly form = new FormGroup({
		clientId: new FormControl("", {
			nonNullable: true,
			validators: [Validators.required, Validators.pattern(OAUTH_CLIENT_ID_PATTERN)],
		}),
		clientSecret: new FormControl("", {
			nonNullable: true,
			validators: [Validators.required, Validators.maxLength(OAUTH_CLIENT_SECRET_MAX_LENGTH)],
		}),
	});

	protected submit(): void {
		if (this.form.invalid) {
			this.form.markAllAsTouched();
			return;
		}
		this.saved.emit(this.form.getRawValue());
	}
}
