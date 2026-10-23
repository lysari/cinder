import type { FormArray, FormControl, FormGroup } from "@angular/forms";
import type { QueryDirection, QueryOperator, QueryValueType } from "../../../../../shared/constants/query";

export type QueryValueControls = FormGroup<{
	type: FormControl<QueryValueType>;
	text: FormControl<string>;
}>;

export type QueryFilterControls = FormGroup<{
	fieldPath: FormControl<string>;
	operator: FormControl<QueryOperator>;
	value: QueryValueControls;
	items: FormArray<QueryValueControls>;
}>;

export type QueryOrderControls = FormGroup<{
	fieldPath: FormControl<string>;
	direction: FormControl<QueryDirection>;
}>;
