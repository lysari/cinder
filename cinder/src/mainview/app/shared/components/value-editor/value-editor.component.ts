import { Component, computed, input, output } from "@angular/core";
import { LucideAngularModule } from "lucide-angular";
import type { FieldDraft, ValueDraft, ValueType } from "../../interfaces/value-draft.interface";
import { changeDraftType, createFieldDraft, fieldNameError, valueError, valueHint } from "../../utils/value-draft";

const MAX_TEXTAREA_ROWS = 8;

@Component({
	selector: "app-value-editor",
	imports: [LucideAngularModule],
	templateUrl: "./value-editor.component.html",
	styleUrl: "./value-editor.component.scss",
})
export class ValueEditorComponent {
	readonly draft = input.required<ValueDraft>();
	readonly isRoot = input(false);
	readonly draftChange = output<ValueDraft>();
	protected readonly error = computed(() => valueError(this.draft()));
	protected readonly hint = computed(() => (this.error() === null ? valueHint(this.draft()) : null));
	protected readonly text = computed(() => {
		const draft = this.draft();
		return "text" in draft ? draft.text : "";
	});
	protected readonly textRows = computed(() => Math.min(this.text().split("\n").length, MAX_TEXTAREA_ROWS));
	protected readonly fields = computed(() => {
		const draft = this.draft();
		return draft.type === "map" ? draft.fields : null;
	});
	protected readonly items = computed(() => {
		const draft = this.draft();
		return draft.type === "array" ? draft.items : null;
	});
	protected readonly geoPoint = computed(() => {
		const draft = this.draft();
		return draft.type === "geopoint" ? draft : null;
	});
	protected readonly booleanText = computed(() => {
		const draft = this.draft();
		return draft.type === "boolean" ? String(draft.value) : "";
	});

	protected changeType(event: Event): void {
		this.draftChange.emit(changeDraftType(this.draft(), (event.target as HTMLSelectElement).value as ValueType));
	}

	protected setText(event: Event): void {
		const draft = this.draft();
		if ("text" in draft) {
			this.draftChange.emit({ ...draft, text: (event.target as HTMLInputElement).value });
		}
	}

	protected setBoolean(event: Event): void {
		this.draftChange.emit({ type: "boolean", value: (event.target as HTMLSelectElement).value === "true" });
	}

	protected setLatitude(event: Event): void {
		const geoPoint = this.geoPoint();
		if (geoPoint) {
			this.draftChange.emit({ ...geoPoint, latitude: (event.target as HTMLInputElement).value });
		}
	}

	protected setLongitude(event: Event): void {
		const geoPoint = this.geoPoint();
		if (geoPoint) {
			this.draftChange.emit({ ...geoPoint, longitude: (event.target as HTMLInputElement).value });
		}
	}

	protected nameError(field: FieldDraft): string | null {
		return fieldNameError(this.fields() ?? [], field);
	}

	protected addField(): void {
		this.emitFields([...(this.fields() ?? []), createFieldDraft()]);
	}

	protected renameField(fieldId: number, event: Event): void {
		const name = (event.target as HTMLInputElement).value;
		this.emitFields((this.fields() ?? []).map((field) => (field.id === fieldId ? { ...field, name } : field)));
	}

	protected setFieldValue(fieldId: number, value: ValueDraft): void {
		this.emitFields((this.fields() ?? []).map((field) => (field.id === fieldId ? { ...field, value } : field)));
	}

	protected removeField(fieldId: number): void {
		this.emitFields((this.fields() ?? []).filter((field) => field.id !== fieldId));
	}

	protected addItem(): void {
		this.draftChange.emit({ type: "array", items: [...(this.items() ?? []), { type: "string", text: "" }] });
	}

	protected setItem(index: number, value: ValueDraft): void {
		this.draftChange.emit({ type: "array", items: (this.items() ?? []).map((item, itemIndex) => (itemIndex === index ? value : item)) });
	}

	protected removeItem(index: number): void {
		this.draftChange.emit({ type: "array", items: (this.items() ?? []).filter((_item, itemIndex) => itemIndex !== index) });
	}

	private emitFields(fields: FieldDraft[]): void {
		this.draftChange.emit({ type: "map", fields });
	}
}
