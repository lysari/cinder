export const QUERY_OPERATORS = ["==", "!=", "<", "<=", ">", ">=", "array-contains", "array-contains-any", "in", "not-in"] as const;
export type QueryOperator = (typeof QUERY_OPERATORS)[number];

export const ARRAY_VALUE_OPERATORS: readonly QueryOperator[] = ["in", "not-in", "array-contains-any"];

export const QUERY_DIRECTIONS = ["asc", "desc"] as const;
export type QueryDirection = (typeof QUERY_DIRECTIONS)[number];

export const QUERY_TARGET_TYPES = ["collection", "collection-group"] as const;
export type QueryTargetType = (typeof QUERY_TARGET_TYPES)[number];

export const QUERY_VALUE_TYPES = ["string", "integer", "double", "boolean", "null", "timestamp"] as const;
export type QueryValueType = (typeof QUERY_VALUE_TYPES)[number];

export const MAX_IN_VALUES = 30;
export const MAX_NOT_IN_VALUES = 10;
export const MAX_QUERY_LIMIT = 2_147_483_647;

export const QUERY_MODES = ["builder", "javascript"] as const;
export type QueryMode = (typeof QUERY_MODES)[number];
