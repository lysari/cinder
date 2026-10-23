import { describe, expect, test } from "bun:test";
import type { CsvDelimiter } from "../../../src/shared/constants/data-transfer";
import { detectCsvDelimiter, readCsvRecords } from "../../../src/worker/utils/csv-reader";

async function readRecords(text: string, delimiter: CsvDelimiter = ",", chunkSize = 5) {
	const bytes = new TextEncoder().encode(text);
	async function* chunks() {
		for (let start = 0; start < bytes.length; start += chunkSize) {
			yield bytes.slice(start, start + chunkSize);
		}
	}
	const records = [];
	for await (const record of readCsvRecords(chunks(), delimiter)) {
		records.push(record);
	}
	return records;
}

describe("readCsvRecords", () => {
	test("reads embedded quotes, delimiters and line breaks in quoted fields", async () => {
		const records = await readRecords('name,note\r\n"Dara ""D""","a, b"\r\n"multi\nline","x"\r\n');
		expect(records.map((record) => record.cells)).toEqual([
			["name", "note"],
			['Dara "D"', "a, b"],
			["multi\nline", "x"],
		]);
		expect(records.map((record) => record.rowNumber)).toEqual([1, 2, 3]);
		expect(records[1]?.hasQuotes).toBe(true);
	});

	test("skips a byte order mark and reads LF, CRLF and a missing last line break", async () => {
		const records = await readRecords("﻿id;value\n1;a\r\n2;b", ";");
		expect(records.map((record) => record.cells)).toEqual([
			["id", "value"],
			["1", "a"],
			["2", "b"],
		]);
	});

	test("reads an unquoted empty cell as null and a quoted one as an empty string", async () => {
		const records = await readRecords('a,b,c\n,"",x\n');
		expect(records[1]?.cells).toEqual([null, "", "x"]);
		expect(records[1]?.hasQuotes).toBe(true);
	});

	test("keeps rows with fewer or more cells than the header", async () => {
		const records = await readRecords("a,b\n1\n1,2,3\n");
		expect(records.map((record) => record.cells)).toEqual([["a", "b"], ["1"], ["1", "2", "3"]]);
	});
});

describe("detectCsvDelimiter", () => {
	test("finds the delimiter that splits rows evenly", () => {
		expect(detectCsvDelimiter("a,b,c\n1,2,3\n4,5,6\n")).toBe(",");
		expect(detectCsvDelimiter("a;b\n1,5;2\n3;4,5\n")).toBe(";");
		expect(detectCsvDelimiter("a\tb\tc\n1\t2\t3\n")).toBe("\t");
		expect(detectCsvDelimiter("a|b\n1|2\n")).toBe("|");
	});

	test("ignores delimiters inside quotes and a cut last line", () => {
		expect(detectCsvDelimiter('name;note\n"x, y";z\n"a, b";c\n"cut, li')).toBe(";");
	});

	test("falls back to a comma for a single column", () => {
		expect(detectCsvDelimiter("name\nDara\n")).toBe(",");
	});
});
