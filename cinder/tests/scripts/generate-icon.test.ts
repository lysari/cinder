import { describe, expect, test } from "bun:test";
import { inflateSync } from "node:zlib";
import { ICONSET_FILES, encodePng, renderIcon } from "../../scripts/generate-icon";

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function readPng(bytes: Uint8Array) {
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	const chunks: { type: string; data: Uint8Array; crc: number }[] = [];
	let offset = PNG_SIGNATURE.length;
	while (offset < bytes.length) {
		const length = view.getUint32(offset);
		const type = new TextDecoder().decode(bytes.subarray(offset + 4, offset + 8));
		chunks.push({ type, data: bytes.subarray(offset + 8, offset + 8 + length), crc: view.getUint32(offset + 8 + length) });
		offset += 12 + length;
	}
	return chunks;
}

describe("generate-icon", () => {
	test("lists every size macOS needs in an iconset", () => {
		expect(ICONSET_FILES.map(({ name, size }) => `${name}:${size}`)).toEqual([
			"icon_16x16.png:16",
			"icon_16x16@2x.png:32",
			"icon_32x32.png:32",
			"icon_32x32@2x.png:64",
			"icon_128x128.png:128",
			"icon_128x128@2x.png:256",
			"icon_256x256.png:256",
			"icon_256x256@2x.png:512",
			"icon_512x512.png:512",
			"icon_512x512@2x.png:1024",
		]);
	});

	test("writes a valid RGBA PNG of the requested size with transparent corners and an opaque middle", () => {
		const size = 64;
		const pixels = renderIcon(size);
		const png = encodePng(size, pixels);
		expect([...png.subarray(0, 8)]).toEqual(PNG_SIGNATURE);
		const chunks = readPng(png);
		expect(chunks.map((chunk) => chunk.type)).toEqual(["IHDR", "IDAT", "IEND"]);
		for (const chunk of chunks) {
			const typed = new Uint8Array([...new TextEncoder().encode(chunk.type), ...chunk.data]);
			expect(chunk.crc).toBe(Bun.hash.crc32(typed));
		}
		const header = new DataView(chunks[0].data.buffer, chunks[0].data.byteOffset);
		expect([header.getUint32(0), header.getUint32(4), chunks[0].data[8], chunks[0].data[9]]).toEqual([size, size, 8, 6]);
		const rows = inflateSync(chunks[1].data);
		expect(rows.length).toBe(size * (size * 4 + 1));

		const alphaAt = (x: number, y: number) => pixels[(y * size + x) * 4 + 3];
		expect(alphaAt(0, 0)).toBe(0);
		expect(alphaAt(size - 1, size - 1)).toBe(0);
		expect(alphaAt(size / 2, size / 2)).toBe(255);
	});
});
