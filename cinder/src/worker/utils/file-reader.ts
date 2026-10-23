import type { TaskProgress } from "../../shared/interfaces/task.interface";

const LINE_FEED = "\n";
const CARRIAGE_RETURN = "\r";

interface TextLine {
	text: string;
	lineNumber: number;
}

/** Reads a file as byte chunks for an import task: sets `progress.totalBytes` first and adds each chunk's size to `progress.bytes`. */
export async function* readFileChunks(filePath: string, progress: TaskProgress): AsyncGenerator<Uint8Array> {
	const file = Bun.file(filePath);
	if (!(await file.exists())) {
		throw new Error("The file no longer exists.");
	}
	progress.totalBytes = file.size;
	for await (const chunk of file.stream()) {
		progress.bytes += chunk.length;
		yield chunk;
	}
}

/** Splits UTF-8 byte chunks into lines without their LF or CRLF ending, numbered from 1. Pass `readFileChunks` or a file stream. */
export async function* readTextLines(chunks: AsyncIterable<Uint8Array>): AsyncGenerator<TextLine> {
	const decoder = new TextDecoder();
	let rest = "";
	let lineNumber = 0;
	for await (const chunk of chunks) {
		const lines = (rest + decoder.decode(chunk, { stream: true })).split(LINE_FEED);
		rest = lines.pop() ?? "";
		for (const line of lines) {
			lineNumber += 1;
			yield { text: withoutCarriageReturn(line), lineNumber };
		}
	}
	rest += decoder.decode();
	if (rest.length > 0) {
		yield { text: withoutCarriageReturn(rest), lineNumber: lineNumber + 1 };
	}
}

function withoutCarriageReturn(line: string): string {
	return line.endsWith(CARRIAGE_RETURN) ? line.slice(0, -1) : line;
}
