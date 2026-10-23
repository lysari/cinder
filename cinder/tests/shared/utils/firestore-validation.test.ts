import { describe, expect, test } from "bun:test";
import {
	isBase64Text,
	isCollectionPath,
	isDocumentPath,
	isIntegerText,
	isValidFieldName,
	isValidId,
} from "../../../src/shared/utils/firestore-validation";

describe("firestore validation", () => {
	test("accepts ids in any script and refuses slashes, dots, reserved and oversized ids", () => {
		expect(isValidId("ភ្នំពេញ")).toBe(true);
		expect(isValidId("a b?#%")).toBe(true);
		expect(isValidId("")).toBe(false);
		expect(isValidId("a/b")).toBe(false);
		expect(isValidId("..")).toBe(false);
		expect(isValidId("__id__")).toBe(false);
		expect(isValidId("x".repeat(1501))).toBe(false);
	});

	test("allows dots and slashes in field names", () => {
		expect(isValidFieldName("a.b/c")).toBe(true);
		expect(isValidFieldName("")).toBe(false);
	});

	test("tells collection paths from document paths", () => {
		expect(isCollectionPath("users")).toBe(true);
		expect(isCollectionPath("users/dara/orders")).toBe(true);
		expect(isCollectionPath("users/dara")).toBe(false);
		expect(isDocumentPath("users/dara")).toBe(true);
		expect(isDocumentPath("users//dara")).toBe(false);
		expect(isDocumentPath("/users/dara")).toBe(false);
	});

	test("checks integer text against the signed 64-bit range", () => {
		expect(isIntegerText("9223372036854775807")).toBe(true);
		expect(isIntegerText("-9223372036854775808")).toBe(true);
		expect(isIntegerText("9223372036854775808")).toBe(false);
		expect(isIntegerText("1e3")).toBe(false);
		expect(isIntegerText("")).toBe(false);
	});

	test("checks padded base64", () => {
		expect(isBase64Text("")).toBe(true);
		expect(isBase64Text("Y2luZGVy")).toBe(true);
		expect(isBase64Text("Bw==")).toBe(true);
		expect(isBase64Text("Bw=")).toBe(false);
		expect(isBase64Text("not base64")).toBe(false);
	});
});
