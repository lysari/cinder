import { Component, input, output } from "@angular/core";
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { LucideAngularModule } from "lucide-angular";
import {
	DEFAULT_EMULATOR_HOST,
	DEFAULT_EMULATOR_PORT,
	EMULATOR_HOST_PATTERN,
	MAX_PORT,
	MIN_PORT,
	PROJECT_ID_PATTERN,
} from "../../../../../../shared/constants/account-validation";
import type { EmulatorAccountForm } from "../../../../../../shared/interfaces/account.interface";

const WHOLE_NUMBER_PATTERN = /^\d+$/;

@Component({
	selector: "app-emulator-account-form",
	imports: [ReactiveFormsModule, LucideAngularModule],
	templateUrl: "./emulator-account-form.component.html",
	styleUrl: "./emulator-account-form.component.scss",
})
export class EmulatorAccountFormComponent {
	readonly isPending = input(false);
	readonly error = input<string | null>(null);
	readonly submitted = output<EmulatorAccountForm>();
	protected readonly form = new FormGroup({
		host: new FormControl(DEFAULT_EMULATOR_HOST, {
			nonNullable: true,
			validators: [Validators.required, Validators.pattern(EMULATOR_HOST_PATTERN)],
		}),
		port: new FormControl(DEFAULT_EMULATOR_PORT, {
			nonNullable: true,
			validators: [Validators.required, Validators.min(MIN_PORT), Validators.max(MAX_PORT), Validators.pattern(WHOLE_NUMBER_PATTERN)],
		}),
		projectIds: new FormArray([createProjectIdControl()]),
	});

	protected addProjectId(): void {
		this.form.controls.projectIds.push(createProjectIdControl());
	}

	protected removeProjectId(index: number): void {
		this.form.controls.projectIds.removeAt(index);
	}

	protected submit(): void {
		if (this.form.invalid) {
			this.form.markAllAsTouched();
			return;
		}
		this.submitted.emit(this.form.getRawValue());
	}
}

function createProjectIdControl(): FormControl<string> {
	return new FormControl("", { nonNullable: true, validators: [Validators.required, Validators.pattern(PROJECT_ID_PATTERN)] });
}
