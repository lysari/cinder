import { Component, effect, input, output, untracked } from "@angular/core";
import { type AbstractControl, FormArray, FormControl, FormGroup, ReactiveFormsModule, type ValidationErrors, Validators } from "@angular/forms";
import { LucideAngularModule } from "lucide-angular";
import { type CsvColumnType, UTC_TIME_ZONE, type WriteMode } from "../../../../../shared/constants/data-transfer";
import type { CsvAnalysisResult, CsvColumnAnalysis } from "../../../../../shared/interfaces/csv.interface";
import { isCollectionPath, isValidFieldName } from "../../../../../shared/utils/firestore-validation";
import type { CsvLoadForm } from "../interfaces/import-form.interface";

const GENERATED_ID = "";
const DELIMITER_NAMES: Record<string, string> = { ",": "comma", ";": "semicolon", "\t": "tab", "|": "bar" };

@Component({
	selector: "app-csv-load-form",
	imports: [ReactiveFormsModule, LucideAngularModule],
	templateUrl: "./csv-load-form.component.html",
	styleUrl: "./csv-load-form.component.scss",
})
export class CsvLoadFormComponent {
	readonly analysis = input.required<CsvAnalysisResult>();
	readonly collectionPath = input<string | null>(null);
	readonly isPending = input(false);
	readonly submitted = output<CsvLoadForm>();
	protected readonly localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
	protected readonly timeZones = [UTC_TIME_ZONE, ...Intl.supportedValuesOf("timeZone").filter((zone) => zone !== UTC_TIME_ZONE)];
	protected readonly delimiterNames = DELIMITER_NAMES;
	protected readonly form = new FormGroup({
		collectionPath: new FormControl("", { nonNullable: true, validators: [Validators.required, collectionPathValidator] }),
		idColumn: new FormControl(GENERATED_ID, { nonNullable: true }),
		timeZone: new FormControl(this.localTimeZone, { nonNullable: true }),
		writeMode: new FormControl<WriteMode>("overwrite", { nonNullable: true }),
		columns: new FormArray<ReturnType<typeof createColumnGroup>>([]),
	});

	constructor() {
		effect(() => {
			const analysis = this.analysis();
			const collectionPath = this.collectionPath();
			untracked(() => {
				this.form.controls.columns.clear();
				for (const column of analysis.columns) {
					this.form.controls.columns.push(createColumnGroup(column));
				}
				this.form.controls.collectionPath.setValue(collectionPath ?? "");
				this.form.controls.idColumn.setValue(GENERATED_ID);
			});
		});
	}

	protected columnName(index: number): string {
		return this.analysis().columns[index]?.name ?? "";
	}

	protected sampleText(index: number): string {
		return this.analysis().columns[index]?.sampleValues.join(", ") ?? "";
	}

	protected submit(): void {
		if (this.form.invalid) {
			this.form.markAllAsTouched();
			return;
		}
		const { collectionPath, idColumn, timeZone, writeMode, columns } = this.form.getRawValue();
		this.submitted.emit({
			delimiter: this.analysis().delimiter,
			collectionPath,
			idColumnIndex: idColumn === GENERATED_ID ? null : Number(idColumn),
			columns: columns.map((column, index) => ({ index, ...column })),
			timeZone,
			writeMode,
		});
	}
}

function createColumnGroup(column: CsvColumnAnalysis) {
	return new FormGroup(
		{
			isIncluded: new FormControl(true, { nonNullable: true }),
			fieldName: new FormControl(column.name, { nonNullable: true }),
			type: new FormControl<CsvColumnType>(column.type, { nonNullable: true }),
		},
		{ validators: [includedFieldNameValidator] },
	);
}

function includedFieldNameValidator(group: AbstractControl): ValidationErrors | null {
	const { isIncluded, fieldName } = group.value as { isIncluded: boolean; fieldName: string };
	return !isIncluded || fieldName.split(".").every(isValidFieldName) ? null : { fieldName: true };
}

function collectionPathValidator(control: AbstractControl<string>): ValidationErrors | null {
	return control.value === "" || isCollectionPath(control.value) ? null : { collectionPath: true };
}
