import { describe, expect, test } from "bun:test";
import { fuzzyScore, rankByFuzzyScore } from "../../../../../src/mainview/app/shared/utils/fuzzy-match";

describe("fuzzyScore", () => {
	test("matches characters in order, ignoring case and spaces, and refuses missing ones", () => {
		expect(fuzzyScore("usr", "Users")).not.toBeNull();
		expect(fuzzyScore("d c", "demo-cinder")).not.toBeNull();
		expect(fuzzyScore("sru", "users")).toBeNull();
		expect(fuzzyScore("x", "users")).toBeNull();
		expect(fuzzyScore("", "anything")).toBe(0);
	});

	test("ranks prefixes above word starts above scattered matches", () => {
		const prefix = fuzzyScore("ord", "orders") as number;
		const wordStart = fuzzyScore("ord", "users/orders") as number;
		const scattered = fuzzyScore("ord", "products-of-red") as number;
		expect(prefix).toBeGreaterThan(wordStart);
		expect(wordStart).toBeGreaterThan(scattered);
	});

	test("matches text in any script", () => {
		expect(fuzzyScore("ឯក", "ឯកសារ")).not.toBeNull();
		expect(fuzzyScore("ÉT", "étudiants")).not.toBeNull();
	});
});

describe("rankByFuzzyScore", () => {
	test("keeps only matches, best first, and keeps the original order on ties", () => {
		const items = ["Show tasks", "New query", "users", "user-logs", "Close tab"];
		expect(rankByFuzzyScore(items, "us", (item) => item)).toEqual(["users", "user-logs"]);
		expect(rankByFuzzyScore(["orders-b", "orders-a"], "ord", (item) => item)).toEqual(["orders-b", "orders-a"]);
		expect(rankByFuzzyScore(items, "", (item) => item)).toEqual(items);
		expect(rankByFuzzyScore(items, "zzz", (item) => item)).toEqual([]);
	});
});
