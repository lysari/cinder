import { describe, expect, test } from "bun:test";
import { load } from "../../../../../src/mainview/app/shared/utils/load";

describe("load", () => {
	test("returns the loaded value", async () => {
		expect(await load(async () => ["users"])).toEqual({ status: "loaded", value: ["users"] });
	});

	test("returns the failure message instead of throwing", async () => {
		expect(await load(async () => Promise.reject(new Error("Firestore did not answer within 30 seconds.")))).toEqual({
			status: "failed",
			error: "Firestore did not answer within 30 seconds.",
		});
	});
});
