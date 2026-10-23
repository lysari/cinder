import { describe, expect, test } from "bun:test";
import type { QueryParseResult, StructuredQuery } from "../../../src/shared/interfaces/query.interface";
import { generateQueryScript } from "../../../src/shared/utils/query-script";
import { parseQueryScript } from "../../../src/shared/utils/query-script-parser";

const USERS = { type: "collection", collectionPath: "users" } as const;

function queryOf(partial: Partial<StructuredQuery>): StructuredQuery {
	return { target: USERS, filters: [], orders: [], limit: null, ...partial };
}

function parsedQuery(script: string): StructuredQuery {
	const result = parseQueryScript(script);
	if (!result.isParsed) {
		throw new Error(`Expected the script to parse, but: ${result.reason}`);
	}
	return result.query;
}

function wrap(chain: string): string {
	return `async function run() {\n  const query = await db.collection("users")${chain}.get();\n  return query;\n}\n`;
}

const ROUND_TRIP_QUERIES: StructuredQuery[] = [
	queryOf({}),
	queryOf({ target: { type: "collection", collectionPath: "users/dara/orders" }, limit: 1 }),
	queryOf({ target: { type: "collection-group", collectionId: "orders" }, orders: [{ fieldPath: "total", direction: "asc" }] }),
	queryOf({
		filters: [
			{ fieldPath: "age", operator: ">=", value: { type: "integer", value: "18" } },
			{ fieldPath: "age", operator: "<", value: { type: "integer", value: "-65" } },
			{ fieldPath: "address.city", operator: "==", value: { type: "string", value: "Phnom Penh" } },
		],
		orders: [
			{ fieldPath: "age", direction: "desc" },
			{ fieldPath: "name", direction: "asc" },
		],
		limit: 2_147_483_647,
	}),
	queryOf({
		filters: [
			{ fieldPath: "score", operator: "!=", value: { type: "double", value: 2 } },
			{ fieldPath: "ratio", operator: "<=", value: { type: "double", value: -0.125 } },
			{ fieldPath: "tiny", operator: ">", value: { type: "double", value: 1e-7 } },
			{ fieldPath: "huge", operator: "<", value: { type: "double", value: 1.5e300 } },
			{ fieldPath: "zero", operator: "==", value: { type: "double", value: -0 } },
			{ fieldPath: "nan", operator: "==", value: { type: "double", value: "NaN" } },
			{ fieldPath: "inf", operator: "<", value: { type: "double", value: "Infinity" } },
			{ fieldPath: "neg", operator: ">", value: { type: "double", value: "-Infinity" } },
		],
	}),
	queryOf({
		filters: [
			{ fieldPath: "big", operator: "==", value: { type: "integer", value: "9223372036854775807" } },
			{ fieldPath: "small", operator: "==", value: { type: "integer", value: "-9223372036854775808" } },
			{ fieldPath: "zero", operator: "==", value: { type: "integer", value: "0" } },
		],
	}),
	queryOf({
		filters: [
			{ fieldPath: "active", operator: "==", value: { type: "boolean", value: true } },
			{ fieldPath: "deleted", operator: "!=", value: { type: "boolean", value: false } },
			{ fieldPath: "owner", operator: "==", value: { type: "null" } },
		],
	}),
	queryOf({
		filters: [
			{ fieldPath: "createdAt", operator: ">=", value: { type: "timestamp", value: { seconds: 1700000000, nanos: 0 } } },
			{ fieldPath: "createdAt", operator: "<", value: { type: "timestamp", value: { seconds: 1700000000, nanos: 999_000_000 } } },
			{ fieldPath: "old", operator: "<", value: { type: "timestamp", value: { seconds: -62135596800, nanos: 0 } } },
			{ fieldPath: "precise", operator: "==", value: { type: "timestamp", value: { seconds: 1, nanos: 123_456_789 } } },
			{ fieldPath: "before", operator: "<", value: { type: "timestamp", value: { seconds: -1, nanos: 1 } } },
		],
	}),
	queryOf({
		filters: [
			{
				fieldPath: "tags",
				operator: "array-contains-any",
				value: {
					type: "array",
					value: [
						{ type: "string", value: "a" },
						{ type: "integer", value: "1" },
						{ type: "double", value: 1.5 },
						{ type: "boolean", value: true },
						{ type: "null" },
						{ type: "timestamp", value: { seconds: 5, nanos: 0 } },
					],
				},
			},
			{ fieldPath: "status", operator: "in", value: { type: "array", value: [] } },
			{ fieldPath: "kind", operator: "not-in", value: { type: "array", value: [{ type: "string", value: "x" }] } },
			{ fieldPath: "labels", operator: "array-contains", value: { type: "string", value: "new" } },
		],
	}),
	queryOf({
		target: { type: "collection", collectionPath: 'we"ird\\path\n\u2028' },
		filters: [
			{ fieldPath: "", operator: "==", value: { type: "string", value: "" } },
			{ fieldPath: "ភាសា.ខ្មែរ", operator: "==", value: { type: "string", value: "😀 \u0000 \t \ud800 '`${x}`'" } },
		],
		orders: [{ fieldPath: "a..b", direction: "desc" }],
		limit: 0,
	}),
];

describe("parseQueryScript round trip", () => {
	test("reads back every query the generator writes, unchanged", () => {
		for (const query of ROUND_TRIP_QUERIES) {
			expect(parsedQuery(generateQueryScript(query))).toEqual(query);
		}
	});

	test("keeps the generated text stable across a second round trip", () => {
		for (const query of ROUND_TRIP_QUERIES) {
			const script = generateQueryScript(query);
			expect(generateQueryScript(parsedQuery(script))).toBe(script);
		}
	});
});

describe("parseQueryScript hand-edited variants", () => {
	const expected = queryOf({
		filters: [{ fieldPath: "age", operator: ">=", value: { type: "integer", value: "18" } }],
		orders: [{ fieldPath: "age", direction: "desc" }],
		limit: 10,
	});

	test("accepts any whitespace, line layout and line ending", () => {
		const variants = [
			`async function run(){const query=await db.collection("users").where("age",">=",18).orderBy("age","desc").limit(10).get();return query;}`,
			`\n\n\tasync   function\trun ( ) {\r\n\tconst query =\r\n\t\tawait db . collection ( "users" )\r\n\t\t.where( "age" , ">=" , 18 )\r\n\t\t.orderBy("age", "desc")\r\n\t\t.limit( 10 )\r\n\t\t.get( );\r\n\treturn query;\r\n}\r\n`,
			`\ufeffasync function run() {\u00a0const query = await db.collection("users").where("age", ">=", 18).orderBy("age", "desc").limit(10).get(); return query; }`,
		];
		for (const script of variants) {
			expect(parsedQuery(script)).toEqual(expected);
		}
	});

	test("accepts missing or extra semicolons where JavaScript inserts them", () => {
		const script = `async function run() {\n  const query = await db.collection("users")\n    .where("age", ">=", 18)\n    .orderBy("age", "desc")\n    .limit(10)\n    .get()\n  return query\n};`;
		expect(parsedQuery(script)).toEqual(expected);
		expect(parsedQuery(`async function run() { const query = await db.collection("users").where("age", ">=", 18).orderBy("age", "desc").limit(10).get(); return query }`)).toEqual(expected);
	});

	test("accepts single-quoted strings with their escapes", () => {
		const script = `async function run() { const query = await db.collection('users').where('age', '>=', 18).orderBy('age', 'desc').limit(10).get(); return query; }`;
		expect(parsedQuery(script)).toEqual(expected);
		const escapes = parsedQuery(wrap(`.where('it\\'s', "==", 'a"b\\\\c\\n\\t\\x41\\u0042\\u{1F600}\\0\\/')`));
		expect(escapes.filters[0]).toEqual({
			fieldPath: "it's",
			operator: "==",
			value: { type: "string", value: 'a"b\\c\n\tAB😀\0/' },
		});
	});

	test("reads an order without a direction as ascending", () => {
		expect(parsedQuery(wrap('.orderBy("name")')).orders).toEqual([{ fieldPath: "name", direction: "asc" }]);
	});

	test("reads BigInt literals, signed numbers and both timestamp forms", () => {
		const query = parsedQuery(
			wrap(
				'.where("a", "==", 5n).where("b", "==", - 7).where("c", "==", 1.50).where("d", "==", 2.).where("e", "==", .5e1)' +
					'.where("f", "==", new admin.firestore.Timestamp(1700000000, 0)).where("g", "==", admin.firestore.Timestamp.fromMillis(-1))' +
					'.where("h", "==", -0)',
			),
		);
		expect(query.filters.map((filter) => filter.value)).toEqual([
			{ type: "integer", value: "5" },
			{ type: "integer", value: "-7" },
			{ type: "double", value: 1.5 },
			{ type: "double", value: 2 },
			{ type: "double", value: 5 },
			{ type: "timestamp", value: { seconds: 1700000000, nanos: 0 } },
			{ type: "timestamp", value: { seconds: -1, nanos: 999_000_000 } },
			{ type: "integer", value: "0" },
		]);
	});
});

describe("parseQueryScript rejects scripts the builder cannot show", () => {
	const rejected: [string, string][] = [
		["an empty script", ""],
		["a partial script", 'async function run() {\n  const query = await db.collection("users")'],
		["a statement before the function", `console.log(1);\n${wrap("")}`],
		["a statement after the function", `${wrap("")}run();`],
		["a second statement in the body", 'async function run() { const query = await db.collection("users").get(); console.log(query); return query; }'],
		["a line comment", `// find users\n${wrap("")}`],
		["a block comment", wrap('/* adults */.where("age", ">=", 18)')],
		["a template literal", wrap(".where(`age`, \">=\", 18)")],
		["an unbalanced quote", wrap('.where("age, ">=", 18)')],
		["a string broken over two lines", wrap('.where("a\nb", "==", 1)')],
		["a line continuation", wrap('.where("a\\\nb", "==", 1)')],
		["an octal escape", wrap('.where("\\101", "==", 1)')],
		["an unknown escape", wrap('.where("\\q", "==", 1)')],
		["a short unicode escape", wrap('.where("\\u12", "==", 1)')],
		["a code point beyond Unicode", wrap('.where("\\u{110000}", "==", 1)')],
		["an unknown method", wrap('.startAfter("x")')],
		["an order before a filter", wrap('.orderBy("age").where("age", ">", 1)')],
		["a limit before an order", wrap('.limit(1).orderBy("age")')],
		["two limits", wrap(".limit(1).limit(2)")],
		["a negative limit", wrap(".limit(-1)")],
		["a fractional limit", wrap(".limit(1.5)")],
		["an unknown operator", wrap('.where("age", "=>", 18)')],
		["an unknown direction", wrap('.orderBy("age", "descending")')],
		["a computed field path", wrap('.where("a" + "b", "==", 1)')],
		["a variable as value", wrap('.where("age", "==", minimum)')],
		["an object value", wrap('.where("age", "==", { min: 1 })')],
		["a nested array", wrap('.where("tags", "in", [["a"]])')],
		["a trailing comma in a list", wrap('.where("tags", "in", ["a",])')],
		["a hole in a list", wrap('.where("tags", "in", ["a",,"b"])')],
		["a trailing comma in a call", wrap('.where("age", "==", 1,)')],
		["a hexadecimal number", wrap('.where("age", "==", 0x10)')],
		["a numeric separator", wrap('.where("age", "==", 1_000)')],
		["a legacy octal number", wrap('.where("age", "==", 017)')],
		["an integer beyond the safe range without n", wrap('.where("age", "==", 9007199254740993)')],
		["a BigInt beyond 64 bits", wrap('.where("age", "==", 9223372036854775808n)')],
		["a BigInt with a fraction", wrap('.where("age", "==", 1.5n)')],
		["a double that overflows", wrap('.where("age", "==", 1e999)')],
		["a unary plus", wrap('.where("age", "==", +1)')],
		["a double minus", wrap('.where("age", "==", --1)')],
		["a fractional fromMillis", wrap('.where("t", "==", admin.firestore.Timestamp.fromMillis(1.5))')],
		["a Date value", wrap('.where("t", "==", new Date(0))')],
		["a computed member", 'async function run() { const query = await db["collection"]("users").get(); return query; }'],
		["a parenthesized db", 'async function run() { const query = await (db).collection("users").get(); return query; }'],
		["an escaped identifier", 'async function run() { const query = await \\u0064b.collection("users").get(); return query; }'],
		["a missing await", 'async function run() { const query = db.collection("users").get(); return query; }'],
		["let instead of const", 'async function run() { let query = await db.collection("users").get(); return query; }'],
		["another variable name", 'async function run() { const snapshot = await db.collection("users").get(); return snapshot; }'],
		["a non-async function", 'function run() { const query = await db.collection("users").get(); return query; }'],
		["async on its own line", 'async\nfunction run() { const query = await db.collection("users").get(); return query; }'],
		["return on its own line", 'async function run() { const query = await db.collection("users").get(); return\nquery; }'],
		["two statements on one line without a semicolon", 'async function run() { const query = await db.collection("users").get() return query; }'],
		["an empty statement", 'async function run() { const query = await db.collection("users").get();; return query; }'],
		["a non-ASCII identifier", 'async function run() { const query = await db.collection("users").where("a", "==", ä).get(); return query; }'],
		["a missing get", 'async function run() { const query = await db.collection("users"); return query; }'],
		["a collection id that is not a string", 'async function run() { const query = await db.collection(users).get(); return query; }'],
	];

	for (const [name, script] of rejected) {
		test(`rejects ${name}`, () => {
			const result: QueryParseResult = parseQueryScript(script);
			expect(result.isParsed).toBe(false);
		});
	}

	test("names the line and the text it cannot show", () => {
		expect(parseQueryScript(`async function run() {\n  const query = await db.collection("users")\n    .startAfter("x")\n    .get();\n  return query;\n}`)).toEqual({
			isParsed: false,
			reason: 'Line 3: the query builder cannot show "startAfter" here.',
		});
		expect(parseQueryScript(`// note\n${wrap("")}`)).toEqual({ isParsed: false, reason: "Line 1: the query builder cannot keep comments." });
		expect(parseQueryScript(wrap('.where("a, "==", 1)'))).toEqual({ isParsed: false, reason: "Line 2: a string is not closed." });
		expect(parseQueryScript("async function run() {")).toEqual({
			isParsed: false,
			reason: "The script ends before the query is complete.",
		});
	});
});
