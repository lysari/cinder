import { Component, effect, input, output, untracked } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { LucideAngularModule } from "lucide-angular";
import {
	ARRAY_VALUE_OPERATORS,
	type QueryDirection,
	type QueryOperator,
	type QueryTargetType,
} from "../../../../../../shared/constants/query";
import type {
	QueryFilterForm,
	QueryForm,
	QueryIssue,
	QueryOrderForm,
	QueryValueForm,
} from "../../../../../../shared/interfaces/query.interface";
import type {
	QueryFilterControls,
	QueryOrderControls,
	QueryValueControls,
} from "../../interfaces/query-builder-controls.interface";
import { QueryValueInputComponent } from "../query-value-input/query-value-input.component";

@Component({
	selector: "app-query-builder",
	imports: [ReactiveFormsModule, LucideAngularModule, QueryValueInputComponent],
	templateUrl: "./query-builder.component.html",
	styleUrl: "./query-builder.component.scss",
})
export class QueryBuilderComponent {
	private lastEmittedValue: QueryForm | null = null;
	readonly value = input.required<QueryForm>();
	readonly issues = input.required<QueryIssue[]>();
	readonly valueChange = output<QueryForm>();
	protected readonly form = new FormGroup({
		targetType: new FormControl<QueryTargetType>("collection", { nonNullable: true }),
		targetPath: new FormControl("", { nonNullable: true }),
		filters: new FormArray<QueryFilterControls>([]),
		orders: new FormArray<QueryOrderControls>([]),
		limitText: new FormControl("", { nonNullable: true }),
	});

	constructor() {
		effect(() => {
			const value = this.value();
			if (value !== this.lastEmittedValue) {
				untracked(() => this.load(value));
			}
		});
		this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
			this.lastEmittedValue = this.form.getRawValue();
			this.valueChange.emit(this.lastEmittedValue);
		});
	}

	protected issuesOf(section: QueryIssue["section"], index: number | null): QueryIssue[] {
		return this.issues().filter((issue) => issue.section === section && issue.index === index);
	}

	protected isListOperator(operator: QueryOperator): boolean {
		return ARRAY_VALUE_OPERATORS.includes(operator);
	}

	protected addFilter(): void {
		this.form.controls.filters.push(filterGroup({ fieldPath: "", operator: "==", value: { type: "string", text: "" }, items: [] }));
	}

	protected removeFilter(index: number): void {
		this.form.controls.filters.removeAt(index);
	}

	protected startListWithValue(filter: QueryFilterControls, event: Event): void {
		const operator = (event.target as HTMLSelectElement).value as QueryOperator;
		if (this.isListOperator(operator) && filter.controls.items.length === 0) {
			filter.controls.items.push(valueGroup(filter.controls.value.getRawValue()));
		}
	}

	protected addItem(filter: QueryFilterControls): void {
		filter.controls.items.push(valueGroup({ type: "string", text: "" }));
	}

	protected removeItem(filter: QueryFilterControls, index: number): void {
		filter.controls.items.removeAt(index);
	}

	protected addOrder(): void {
		this.form.controls.orders.push(orderGroup({ fieldPath: "", direction: "asc" }));
	}

	protected removeOrder(index: number): void {
		this.form.controls.orders.removeAt(index);
	}

	private load(value: QueryForm): void {
		const { filters, orders } = this.form.controls;
		filters.clear({ emitEvent: false });
		value.filters.forEach((filter) => filters.push(filterGroup(filter), { emitEvent: false }));
		orders.clear({ emitEvent: false });
		value.orders.forEach((order) => orders.push(orderGroup(order), { emitEvent: false }));
		this.form.setValue(value, { emitEvent: false });
	}
}

function valueGroup(value: QueryValueForm): QueryValueControls {
	return new FormGroup({
		type: new FormControl(value.type, { nonNullable: true }),
		text: new FormControl(value.text, { nonNullable: true }),
	});
}

function filterGroup(filter: QueryFilterForm): QueryFilterControls {
	return new FormGroup({
		fieldPath: new FormControl(filter.fieldPath, { nonNullable: true }),
		operator: new FormControl<QueryOperator>(filter.operator, { nonNullable: true }),
		value: valueGroup(filter.value),
		items: new FormArray(filter.items.map(valueGroup)),
	});
}

function orderGroup(order: QueryOrderForm): QueryOrderControls {
	return new FormGroup({
		fieldPath: new FormControl(order.fieldPath, { nonNullable: true }),
		direction: new FormControl<QueryDirection>(order.direction, { nonNullable: true }),
	});
}
