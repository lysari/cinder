import { Component, computed, effect, input, output, untracked } from "@angular/core";
import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { type AbstractControl, FormControl, FormGroup, ReactiveFormsModule, type ValidationErrors, Validators } from "@angular/forms";
import { LucideAngularModule } from "lucide-angular";
import type { WriteMode } from "../../../../../../shared/constants/data-transfer";
import type { ImportFileSummary } from "../../../../../../shared/interfaces/import.interface";
import { isCollectionPath } from "../../../../../../shared/utils/firestore-validation";
import type { JsonImportForm } from "../../interfaces/import-form.interface";

@Component({
	selector: "app-json-import-form",
	imports: [ReactiveFormsModule, LucideAngularModule],
	templateUrl: "./json-import-form.component.html",
})
export class JsonImportFormComponent {
	readonly file = input.required<ImportFileSummary>();
	readonly collectionPath = input<string | null>(null);
	readonly isPending = input(false);
	readonly submitted = output<JsonImportForm>();
	protected readonly form = new FormGroup({
		targetType: new FormControl<"original-paths" | "collection">("collection", { nonNullable: true }),
		collectionPath: new FormControl("", { nonNullable: true, validators: [Validators.required, collectionPathValidator] }),
		writeMode: new FormControl<WriteMode>("overwrite", { nonNullable: true }),
	});
	private readonly formValue = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
	protected readonly isCinderFile = computed(() => this.file().format !== "json");
	protected readonly pathMapping = computed(() => {
		const { rootPath } = this.file();
		const { targetType, collectionPath } = this.formValue();
		if (!this.isCinderFile() || targetType !== "collection" || !collectionPath || rootPath === collectionPath) {
			return null;
		}
		return rootPath === null
			? `Each document is written to ${collectionPath}/<its id>; the export has no single root collection.`
			: `Paths below ${rootPath} move below ${collectionPath}: ${rootPath}/<id>/… becomes ${collectionPath}/<id>/….`;
	});

	constructor() {
		effect(() => {
			const file = this.file();
			const collectionPath = this.collectionPath();
			untracked(() => {
				const isCinder = file.format !== "json";
				this.form.setValue({
					targetType: isCinder && collectionPath === null ? "original-paths" : "collection",
					collectionPath: collectionPath ?? file.rootPath ?? "",
					writeMode: "overwrite",
				});
				this.syncCollectionPathState();
			});
		});
		this.form.controls.targetType.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.syncCollectionPathState());
	}

	protected submit(): void {
		if (this.form.invalid) {
			this.form.markAllAsTouched();
			return;
		}
		const { targetType, collectionPath, writeMode } = this.form.getRawValue();
		this.submitted.emit({
			target: targetType === "collection" ? { type: "collection", collectionPath } : { type: "original-paths" },
			writeMode,
		});
	}

	private syncCollectionPathState(): void {
		const control = this.form.controls.collectionPath;
		if (this.form.controls.targetType.value === "collection") {
			control.enable({ emitEvent: false });
		} else {
			control.disable({ emitEvent: false });
		}
	}
}

function collectionPathValidator(control: AbstractControl<string>): ValidationErrors | null {
	return control.value === "" || isCollectionPath(control.value) ? null : { collectionPath: true };
}
