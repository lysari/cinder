import { ARRAY_VALUE_OPERATORS } from "../../../../shared/constants/query";
import type {
	QueryFilter,
	QueryFilterForm,
	QueryForm,
	QueryFormResult,
	QueryIssue,
	QueryScalarValue,
	QueryTarget,
	QueryValue,
	QueryValueForm,
	StructuredQuery,
} from "../../../../shared/interfaces/query.interface";
import { validateQuery } from "../../../../shared/utils/query-validation";
import type { ValueDraft } from "../interfaces/value-draft.interface";
import { draftFromValue, valueError, valueFromDraft } from "./value-draft";

const EMPTY_VALUE_FORM: QueryValueForm = { type: "string", text: "" };
const LIMIT_TEXT_ERROR = "Enter a whole number, or leave the limit empty for no limit.";

/** Creates the query builder's form values for a structured query, e.g. one read back from a script. Read them with `readQueryForm`. */
export function queryFormFromQuery(query: StructuredQuery): QueryForm {
	const { target } = query;
	return {
		targetType: target.type,
		targetPath: target.type === "collection" ? target.collectionPath : target.collectionId,
		filters: query.filters.map((filter) => ({
			fieldPath: filter.fieldPath,
			operator: filter.operator,
			value: filter.value.type === "array" ? { ...EMPTY_VALUE_FORM } : valueFormOf(filter.value),
			items: filter.value.type === "array" ? filter.value.value.map(valueFormOf) : [],
		})),
		orders: query.orders.map((order) => ({ ...order })),
		limitText: query.limit === null ? "" : String(query.limit),
	};
}

/** Reads the query builder's form values. Returns the query with every issue, or a null query while a typed value cannot be read. */
export function readQueryForm(form: QueryForm): QueryFormResult {
	const issues: QueryIssue[] = [];
	const filters = form.filters.map((filter, index) => readFilter(filter, index, issues));
	const limit = readLimit(form.limitText, issues);
	if (issues.length > 0) {
		return { query: null, issues };
	}
	const query: StructuredQuery = {
		target: readTarget(form),
		filters: filters as QueryFilter[],
		orders: form.orders.map((order) => ({ fieldPath: order.fieldPath, direction: order.direction })),
		limit,
	};
	return { query, issues: validateQuery(query) };
}

function readTarget({ targetType, targetPath }: QueryForm): QueryTarget {
	return targetType === "collection"
		? { type: "collection", collectionPath: targetPath }
		: { type: "collection-group", collectionId: targetPath };
}

function readFilter(filter: QueryFilterForm, index: number, issues: QueryIssue[]): QueryFilter | null {
	const isList = ARRAY_VALUE_OPERATORS.includes(filter.operator);
	const valueForms = isList ? filter.items : [filter.value];
	const errors = valueForms.map((valueForm) => valueError(draftOf(valueForm)));
	errors.forEach((error, itemIndex) => {
		if (error) {
			issues.push({ section: "filter", index, message: isList ? `Value ${itemIndex + 1}: ${error}` : error });
		}
	});
	if (errors.some((error) => error !== null)) {
		return null;
	}
	const scalars = valueForms.map((valueForm) => valueFromDraft(draftOf(valueForm)) as QueryScalarValue);
	const value: QueryValue = isList ? { type: "array", value: scalars } : (scalars[0] as QueryScalarValue);
	return { fieldPath: filter.fieldPath, operator: filter.operator, value };
}

function readLimit(text: string, issues: QueryIssue[]): number | null {
	if (text.trim().length === 0) {
		return null;
	}
	const draft: ValueDraft = { type: "integer", text };
	if (valueError(draft) !== null) {
		issues.push({ section: "limit", index: null, message: LIMIT_TEXT_ERROR });
		return null;
	}
	const value = valueFromDraft(draft);
	return value.type === "integer" ? Number(value.value) : null;
}

function draftOf({ type, text }: QueryValueForm): ValueDraft {
	switch (type) {
		case "boolean":
			return { type, value: text === "true" };
		case "null":
			return { type };
		default:
			return { type, text };
	}
}

function valueFormOf(value: QueryScalarValue): QueryValueForm {
	switch (value.type) {
		case "boolean":
			return { type: "boolean", text: String(value.value) };
		case "null":
			return { type: "null", text: "" };
		default: {
			const draft = draftFromValue(value);
			return { type: value.type, text: "text" in draft ? draft.text : "" };
		}
	}
}
