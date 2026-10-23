import { describe, expect, test } from "bun:test";
import { createContext, Script } from "node:vm";
import type { QueryValue, StructuredQuery } from "../../../src/shared/interfaces/query.interface";
import { generateQueryScript } from "../../../src/shared/utils/query-script";

function queryOf(partial: Partial<StructuredQuery>): StructuredQuery {
	return { target: { type: "collection", collectionPath: "users" }, filters: [], orders: [], limit: null, ...partial };
}

function filterScript(value: QueryValue): string {
	return generateQueryScript(queryOf({ filters: [{ fieldPath: "field", operator: "==", value }] }));
}

function whereLine(value: QueryValue): string | undefined {
	return filterScript(value)
		.split("\n")
		.find((line) => line.includes(".where("))
		?.trim();
}

async function runWithRecordingDb(script: string): Promise<{ calls: unknown[][]; result: unknown }> {
	const calls: unknown[][] = [];
	const chain: Record<string, (...args: unknown[]) => unknown> = {};
	for (const method of ["collection", "collectionGroup", "where", "orderBy", "limit"]) {
		chain[method] = (...args: unknown[]) => {
			calls.push([method, ...args]);
			return chain;
		};
	}
	chain.get = async () => "snapshot";
	class Timestamp {
		constructor(
			readonly seconds: number,
			readonly nanos: number,
		) {}
		static fromMillis = (millis: number) => ({ millis });
	}
	const context = createContext({ db: chain, admin: { firestore: { Timestamp } } });
	new Script(script).runInContext(context);
	return { calls, result: await context.run() };
}

describe("generateQueryScript", () => {
	test("writes a collection query with filters, orders and a limit in a fixed layout", () => {
		const script = generateQueryScript(
			queryOf({
				filters: [
					{ fieldPath: "age", operator: ">=", value: { type: "integer", value: "18" } },
					{ fieldPath: "tags", operator: "array-contains-any", value: { type: "array", value: [{ type: "string", value: "a" }] } },
				],
				orders: [{ fieldPath: "age", direction: "desc" }],
				limit: 20,
			}),
		);
		expect(script).toBe(
			[
				"async function run() {",
				'  const query = await db.collection("users")',
				'    .where("age", ">=", 18)',
				'    .where("tags", "array-contains-any", ["a"])',
				'    .orderBy("age", "desc")',
				"    .limit(20)",
				"    .get();",
				"  return query;",
				"}",
				"",
			].join("\n"),
		);
	});

	test("writes a collection group query without filters or limit", () => {
		expect(generateQueryScript(queryOf({ target: { type: "collection-group", collectionId: "orders" } }))).toBe(
			'async function run() {\n  const query = await db.collectionGroup("orders")\n    .get();\n  return query;\n}\n',
		);
	});

	test("writes each value type as a literal that keeps its type", () => {
		expect(whereLine({ type: "string", value: 'say "hi"\\\n' })).toBe('.where("field", "==", "say \\"hi\\"\\\\\\n")');
		expect(whereLine({ type: "integer", value: "-42" })).toBe('.where("field", "==", -42)');
		expect(whereLine({ type: "integer", value: "9007199254740993" })).toBe('.where("field", "==", 9007199254740993n)');
		expect(whereLine({ type: "double", value: 2 })).toBe('.where("field", "==", 2.0)');
		expect(whereLine({ type: "double", value: 0.1 })).toBe('.where("field", "==", 0.1)');
		expect(whereLine({ type: "double", value: 1e21 })).toBe('.where("field", "==", 1e+21)');
		expect(whereLine({ type: "double", value: -0 })).toBe('.where("field", "==", -0.0)');
		expect(whereLine({ type: "double", value: "NaN" })).toBe('.where("field", "==", NaN)');
		expect(whereLine({ type: "double", value: "-Infinity" })).toBe('.where("field", "==", -Infinity)');
		expect(whereLine({ type: "boolean", value: false })).toBe('.where("field", "==", false)');
		expect(whereLine({ type: "null" })).toBe('.where("field", "==", null)');
		expect(whereLine({ type: "timestamp", value: { seconds: 1700000000, nanos: 5_000_000 } })).toBe(
			'.where("field", "==", admin.firestore.Timestamp.fromMillis(1700000000005))',
		);
		expect(whereLine({ type: "timestamp", value: { seconds: 1700000000, nanos: 123456 } })).toBe(
			'.where("field", "==", new admin.firestore.Timestamp(1700000000, 123456))',
		);
		expect(whereLine({ type: "timestamp", value: { seconds: -2, nanos: 500_000_000 } })).toBe(
			'.where("field", "==", admin.firestore.Timestamp.fromMillis(-1500))',
		);
	});

	test("passes hostile field paths and values to the SDK unchanged instead of running them", async () => {
		const hostile = 'x"); globalThis.hacked = true; ("\u2028</script>${1}`\\';
		const script = generateQueryScript(
			queryOf({
				target: { type: "collection", collectionPath: hostile },
				filters: [{ fieldPath: hostile, operator: "in", value: { type: "array", value: [{ type: "string", value: hostile }] } }],
				orders: [{ fieldPath: hostile, direction: "asc" }],
				limit: 5,
			}),
		);
		const { calls, result } = await runWithRecordingDb(script);
		expect(result).toBe("snapshot");
		expect(calls).toEqual([
			["collection", hostile],
			["where", hostile, "in", [hostile]],
			["orderBy", hostile, "asc"],
			["limit", 5],
		]);
	});

	test("produces values the run-script context evaluates to the intended numbers and timestamps", async () => {
		const script = generateQueryScript(
			queryOf({
				filters: [
					{ fieldPath: "big", operator: "==", value: { type: "integer", value: "-9223372036854775808" } },
					{ fieldPath: "when", operator: "<", value: { type: "timestamp", value: { seconds: 10, nanos: 1 } } },
					{ fieldPath: "at", operator: ">", value: { type: "timestamp", value: { seconds: 10, nanos: 0 } } },
				],
			}),
		);
		const { calls } = await runWithRecordingDb(script);
		expect(calls[1]).toEqual(["where", "big", "==", -9223372036854775808n]);
		expect(calls[2]).toMatchObject(["where", "when", "<", { seconds: 10, nanos: 1 }]);
		expect(calls[3]).toEqual(["where", "at", ">", { millis: 10000 }]);
	});
});
