import { MAX_INTEGER, MIN_INTEGER } from "../constants/firestore-limits";
import { QUERY_DIRECTIONS, QUERY_OPERATORS, type QueryDirection } from "../constants/query";
import type {
	QueryFilter,
	QueryOrder,
	QueryParseResult,
	QueryScalarValue,
	QueryTarget,
	QueryValue,
	StructuredQuery,
} from "../interfaces/query.interface";

type TokenKind = "word" | "punctuator" | "string" | "number";

interface Token {
	kind: TokenKind;
	text: string;
	value: string;
	line: number;
	isAfterLineBreak: boolean;
}

const WORD_PATTERN = /[A-Za-z_$][A-Za-z0-9_$]*/y;
const NUMBER_PATTERN = /(?:(?:0|[1-9]\d*)(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?n?/y;
const WORD_CHARACTER_PATTERN = /[A-Za-z0-9_$]/;
const WHITESPACE_PATTERN = /\s/u;
const LINE_BREAK_PATTERN = /[\n\r\u2028\u2029]/;
const HEX_PATTERN = /^[0-9a-fA-F]+$/;
const PLAIN_INTEGER_PATTERN = /^(?:0|[1-9]\d*)$/;
const DIGIT_PATTERN = /\d/;
const PUNCTUATORS = new Set([".", "(", ")", ",", "[", "]", "{", "}", ";", "=", "-"]);
const SIMPLE_ESCAPES: Record<string, string> = {
	n: "\n",
	r: "\r",
	t: "\t",
	b: "\b",
	f: "\f",
	v: "\v",
	"'": "'",
	'"': '"',
	"\\": "\\",
	"/": "/",
};
const MAX_CODE_POINT = 0x10ffff;
const MILLIS_PER_SECOND = 1000;
const NANOS_PER_MILLI = 1_000_000;

class NotRepresentableError extends Error {}

/** Reads a run-script program back into a structured query when it has exactly the shape `generateQueryScript` writes. */
export function parseQueryScript(script: string): QueryParseResult {
	try {
		return { isParsed: true, query: new QueryScriptReader(tokenize(script)).readProgram() };
	} catch (error) {
		if (error instanceof NotRepresentableError) {
			return { isParsed: false, reason: error.message };
		}
		throw error;
	}
}

class QueryScriptReader {
	private index = 0;

	constructor(private readonly tokens: Token[]) {}

	readProgram(): StructuredQuery {
		this.expectWord("async");
		this.expectWord("function", { isOnSameLine: true });
		this.expectWord("run");
		this.expect("(");
		this.expect(")");
		this.expect("{");
		this.expectWord("const");
		this.expectWord("query");
		this.expect("=");
		this.expectWord("await");
		const target = this.readTarget();
		const filters: QueryFilter[] = [];
		while (this.isCallNext("where")) {
			filters.push(this.readFilter());
		}
		const orders: QueryOrder[] = [];
		while (this.isCallNext("orderBy")) {
			orders.push(this.readOrder());
		}
		const limit = this.isCallNext("limit") ? this.readLimit() : null;
		this.expect(".");
		this.expectWord("get");
		this.expect("(");
		this.expect(")");
		this.expectStatementEnd();
		this.expectWord("return");
		this.expectWord("query", { isOnSameLine: true });
		this.skipOptional(";");
		this.expect("}");
		this.skipOptional(";");
		const extra = this.tokens[this.index];
		if (extra) {
			throw unexpected(extra);
		}
		return { target, filters, orders, limit };
	}

	private readTarget(): QueryTarget {
		this.expectWord("db");
		this.expect(".");
		const method = this.next();
		if (method.kind !== "word" || (method.value !== "collection" && method.value !== "collectionGroup")) {
			throw unexpected(method);
		}
		this.expect("(");
		const name = this.readString();
		this.expect(")");
		return method.value === "collection"
			? { type: "collection", collectionPath: name }
			: { type: "collection-group", collectionId: name };
	}

	private readFilter(): QueryFilter {
		this.expect(".");
		this.expectWord("where");
		this.expect("(");
		const fieldPath = this.readString();
		this.expect(",");
		const operatorToken = this.peek();
		const operatorText = this.readString();
		const operator = QUERY_OPERATORS.find((candidate) => candidate === operatorText);
		if (!operator) {
			throw unexpected(operatorToken);
		}
		this.expect(",");
		const value = this.readValue();
		this.expect(")");
		return { fieldPath, operator, value };
	}

	private readOrder(): QueryOrder {
		this.expect(".");
		this.expectWord("orderBy");
		this.expect("(");
		const fieldPath = this.readString();
		let direction: QueryDirection = "asc";
		if (this.peek()?.text === ",") {
			this.next();
			const directionToken = this.peek();
			const directionText = this.readString();
			const named = QUERY_DIRECTIONS.find((candidate) => candidate === directionText);
			if (!named) {
				throw unexpected(directionToken);
			}
			direction = named;
		}
		this.expect(")");
		return { fieldPath, direction };
	}

	private readLimit(): number {
		this.expect(".");
		this.expectWord("limit");
		this.expect("(");
		const token = this.next();
		const limit = token.kind === "number" ? Number(token.value) : Number.NaN;
		if (!isPlainIntegerText(token.value) || !Number.isSafeInteger(limit)) {
			throw unexpected(token);
		}
		this.expect(")");
		return limit;
	}

	private readValue(): QueryValue {
		if (this.peek()?.text !== "[") {
			return this.readScalar();
		}
		this.next();
		const items: QueryScalarValue[] = [];
		while (this.peek()?.text !== "]") {
			if (items.length > 0) {
				this.expect(",");
			}
			items.push(this.readScalar());
		}
		this.next();
		return { type: "array", value: items };
	}

	private readScalar(): QueryScalarValue {
		const token = this.next();
		if (token.kind === "string") {
			return { type: "string", value: token.value };
		}
		if (token.kind === "number") {
			return numberValue(token, false);
		}
		if (token.text === "-") {
			const operand = this.next();
			if (operand.kind === "number") {
				return numberValue(operand, true);
			}
			if (operand.text === "Infinity") {
				return { type: "double", value: "-Infinity" };
			}
			throw unexpected(operand);
		}
		switch (token.text) {
			case "true":
			case "false":
				return { type: "boolean", value: token.text === "true" };
			case "null":
				return { type: "null" };
			case "NaN":
			case "Infinity":
				return { type: "double", value: token.text };
			case "admin":
				return this.readFromMillis();
			case "new":
				return this.readTimestampConstructor();
			default:
				throw unexpected(token);
		}
	}

	private readFromMillis(): QueryScalarValue {
		this.readTimestampClass();
		this.expect(".");
		this.expectWord("fromMillis");
		this.expect("(");
		const millis = this.readSignedInteger();
		this.expect(")");
		const seconds = Math.floor(millis / MILLIS_PER_SECOND);
		return { type: "timestamp", value: { seconds, nanos: (millis - seconds * MILLIS_PER_SECOND) * NANOS_PER_MILLI } };
	}

	private readTimestampConstructor(): QueryScalarValue {
		this.expectWord("admin");
		this.readTimestampClass();
		this.expect("(");
		const seconds = this.readSignedInteger();
		this.expect(",");
		const nanos = this.readSignedInteger();
		this.expect(")");
		return { type: "timestamp", value: { seconds, nanos } };
	}

	private readTimestampClass(): void {
		this.expect(".");
		this.expectWord("firestore");
		this.expect(".");
		this.expectWord("Timestamp");
	}

	private readSignedInteger(): number {
		const isNegative = this.peek()?.text === "-";
		if (isNegative) {
			this.next();
		}
		const token = this.next();
		const value = token.kind === "number" ? Number(token.value) : Number.NaN;
		if (!isPlainIntegerText(token.value) || !Number.isSafeInteger(value)) {
			throw unexpected(token);
		}
		return isNegative && value !== 0 ? -value : value;
	}

	private readString(): string {
		const token = this.next();
		if (token.kind !== "string") {
			throw unexpected(token);
		}
		return token.value;
	}

	private isCallNext(method: string): boolean {
		const name = this.tokens[this.index + 1];
		return this.peek()?.text === "." && name?.kind === "word" && name.value === method;
	}

	private expectWord(word: string, options: { isOnSameLine?: boolean } = {}): void {
		const token = this.next();
		if (token.kind !== "word" || token.value !== word || (options.isOnSameLine && token.isAfterLineBreak)) {
			throw unexpected(token);
		}
	}

	private expect(punctuator: string): void {
		const token = this.next();
		if (token.kind !== "punctuator" || token.text !== punctuator) {
			throw unexpected(token);
		}
	}

	private expectStatementEnd(): void {
		const token = this.peek();
		if (token?.kind === "punctuator" && token.text === ";") {
			this.next();
		} else if (token && !token.isAfterLineBreak) {
			throw unexpected(token);
		}
	}

	private skipOptional(punctuator: string): void {
		if (this.peek()?.kind === "punctuator" && this.peek()?.text === punctuator) {
			this.next();
		}
	}

	private peek(): Token | undefined {
		return this.tokens[this.index];
	}

	private next(): Token {
		const token = this.tokens[this.index];
		if (!token) {
			throw new NotRepresentableError("The script ends before the query is complete.");
		}
		this.index += 1;
		return token;
	}
}

function numberValue(token: Token, isNegative: boolean): QueryScalarValue {
	const sign = isNegative ? "-" : "";
	if (token.value.endsWith("n")) {
		const digits = token.value.slice(0, -1);
		if (!isPlainIntegerText(digits)) {
			throw unexpected(token);
		}
		const integer = BigInt(`${sign}${digits}`);
		if (integer < MIN_INTEGER || integer > MAX_INTEGER) {
			throw unexpected(token);
		}
		return { type: "integer", value: integer.toString() };
	}
	if (isPlainIntegerText(token.value)) {
		if (!Number.isSafeInteger(Number(token.value))) {
			throw unexpected(token);
		}
		return { type: "integer", value: BigInt(`${sign}${token.value}`).toString() };
	}
	const double = Number(`${sign}${token.value}`);
	if (!Number.isFinite(double)) {
		throw unexpected(token);
	}
	return { type: "double", value: double };
}

function isPlainIntegerText(text: string): boolean {
	return PLAIN_INTEGER_PATTERN.test(text);
}

function unexpected(token: Token | undefined): NotRepresentableError {
	if (!token) {
		return new NotRepresentableError("The script ends before the query is complete.");
	}
	return new NotRepresentableError(`Line ${token.line}: the query builder cannot show ${JSON.stringify(token.text)} here.`);
}

function tokenize(script: string): Token[] {
	const tokens: Token[] = [];
	let index = 0;
	let line = 1;
	let isAfterLineBreak = false;
	while (index < script.length) {
		const character = script[index] as string;
		if (WHITESPACE_PATTERN.test(character)) {
			if (LINE_BREAK_PATTERN.test(character) && !(character === "\r" && script[index + 1] === "\n")) {
				line += 1;
				isAfterLineBreak = true;
			}
			index += 1;
			continue;
		}
		const token = readToken(script, index, line);
		tokens.push({ ...token, line, isAfterLineBreak });
		index += token.text.length;
		isAfterLineBreak = false;
	}
	return tokens;
}

function readToken(script: string, index: number, line: number): Omit<Token, "line" | "isAfterLineBreak"> {
	const character = script[index] as string;
	if (character === '"' || character === "'") {
		return readStringToken(script, index, line);
	}
	if (character === "/" && (script[index + 1] === "/" || script[index + 1] === "*")) {
		throw new NotRepresentableError(`Line ${line}: the query builder cannot keep comments.`);
	}
	if (character === "`") {
		throw new NotRepresentableError(`Line ${line}: the query builder cannot show template literals.`);
	}
	const word = matchAt(WORD_PATTERN, script, index);
	if (word) {
		return { kind: "word", text: word, value: word };
	}
	const number = matchAt(NUMBER_PATTERN, script, index);
	if (number) {
		const following = script[index + number.length];
		if (following !== undefined && (WORD_CHARACTER_PATTERN.test(following) || following === ".")) {
			throw new NotRepresentableError(`Line ${line}: the query builder cannot show this number.`);
		}
		return { kind: "number", text: number, value: number };
	}
	if (PUNCTUATORS.has(character)) {
		return { kind: "punctuator", text: character, value: character };
	}
	const codePoint = String.fromCodePoint(script.codePointAt(index) as number);
	throw new NotRepresentableError(`Line ${line}: the query builder cannot show ${JSON.stringify(codePoint)} here.`);
}

function readStringToken(script: string, start: number, line: number): Omit<Token, "line" | "isAfterLineBreak"> {
	const quote = script[start];
	let value = "";
	let index = start + 1;
	while (index < script.length) {
		const character = script[index] as string;
		if (character === quote) {
			return { kind: "string", text: script.slice(start, index + 1), value };
		}
		if (character === "\n" || character === "\r") {
			break;
		}
		if (character !== "\\") {
			value += character;
			index += 1;
			continue;
		}
		const escape = readEscape(script, index + 1);
		if (escape === null) {
			throw new NotRepresentableError(`Line ${line}: the query builder cannot show this escape in a string.`);
		}
		value += escape.text;
		index = escape.end;
	}
	throw new NotRepresentableError(`Line ${line}: a string is not closed.`);
}

function readEscape(script: string, index: number): { text: string; end: number } | null {
	const character = script[index];
	if (character === undefined) {
		return null;
	}
	const simple = SIMPLE_ESCAPES[character];
	if (simple !== undefined) {
		return { text: simple, end: index + 1 };
	}
	if (character === "0" && !DIGIT_PATTERN.test(script[index + 1] ?? "")) {
		return { text: "\0", end: index + 1 };
	}
	if (character === "x") {
		return codePointEscape(script.slice(index + 1, index + 3), 2, index + 3);
	}
	if (character !== "u") {
		return null;
	}
	if (script[index + 1] !== "{") {
		return codePointEscape(script.slice(index + 1, index + 5), 4, index + 5);
	}
	const close = script.indexOf("}", index + 2);
	return close < 0 ? null : codePointEscape(script.slice(index + 2, close), null, close + 1);
}

function codePointEscape(hex: string, length: number | null, end: number): { text: string; end: number } | null {
	if (!HEX_PATTERN.test(hex) || (length !== null && hex.length !== length)) {
		return null;
	}
	const codePoint = Number.parseInt(hex, 16);
	if (codePoint > MAX_CODE_POINT) {
		return null;
	}
	return { text: length === null ? String.fromCodePoint(codePoint) : String.fromCharCode(codePoint), end };
}

function matchAt(pattern: RegExp, text: string, index: number): string | null {
	pattern.lastIndex = index;
	return pattern.exec(text)?.[0] ?? null;
}
