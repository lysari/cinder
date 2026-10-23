import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { deflateSync } from "node:zlib";

type Color = [number, number, number];

interface Point {
	x: number;
	y: number;
}

export const ICONSET_FILES: readonly { name: string; size: number }[] = [
	{ name: "icon_16x16.png", size: 16 },
	{ name: "icon_16x16@2x.png", size: 32 },
	{ name: "icon_32x32.png", size: 32 },
	{ name: "icon_32x32@2x.png", size: 64 },
	{ name: "icon_128x128.png", size: 128 },
	{ name: "icon_128x128@2x.png", size: 256 },
	{ name: "icon_256x256.png", size: 256 },
	{ name: "icon_256x256@2x.png", size: 512 },
	{ name: "icon_512x512.png", size: 512 },
	{ name: "icon_512x512@2x.png", size: 1024 },
];

const CANVAS = 1024;
const SAMPLES_PER_AXIS = 4;
const TILE = { left: 100, top: 100, size: 824, radius: 185 };
const TILE_TOP_COLOR: Color = [0x46, 0x42, 0x3e];
const TILE_BOTTOM_COLOR: Color = [0x1d, 0x1c, 0x1b];
const GLOW = { center: { x: 512, y: 640 }, radius: 360, strength: 0.38, color: [0xef, 0x6a, 0x1f] as Color };
const FLAME = { base: { x: 512, y: 650 }, baseRadius: 190, height: 400, tipRadius: 14 };
const CORE = { base: { x: 512, y: 700 }, baseRadius: 92, height: 205, tipRadius: 8 };
const FLAME_STOPS: readonly [number, Color][] = [
	[0, [0xff, 0xd2, 0x7a]],
	[0.45, [0xfb, 0x8a, 0x45]],
	[1, [0xc2, 0x50, 0x0e]],
];
const CORE_COLOR: Color = [0xff, 0xf1, 0xd0];
const SPARKS = [
	{ center: { x: 712, y: 318 }, radius: 74 },
	{ center: { x: 318, y: 372 }, radius: 38 },
];
const SPARK_COLOR: Color = [0xff, 0xd2, 0x7a];
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const PNG_COLOR_TYPE_RGBA = 6;

export function renderIcon(size: number): Uint8Array {
	const pixels = new Uint8Array(size * size * 4);
	const scale = CANVAS / size;
	const sampleCount = SAMPLES_PER_AXIS * SAMPLES_PER_AXIS;
	for (let row = 0; row < size; row++) {
		for (let column = 0; column < size; column++) {
			const total = [0, 0, 0, 0];
			for (let sample = 0; sample < sampleCount; sample++) {
				const x = (column + ((sample % SAMPLES_PER_AXIS) + 0.5) / SAMPLES_PER_AXIS) * scale;
				const y = (row + (Math.floor(sample / SAMPLES_PER_AXIS) + 0.5) / SAMPLES_PER_AXIS) * scale;
				const color = colorAt({ x, y });
				if (color) {
					total[0] += color[0];
					total[1] += color[1];
					total[2] += color[2];
					total[3] += 1;
				}
			}
			const offset = (row * size + column) * 4;
			const coverage = total[3];
			pixels[offset] = coverage ? Math.round(total[0] / coverage) : 0;
			pixels[offset + 1] = coverage ? Math.round(total[1] / coverage) : 0;
			pixels[offset + 2] = coverage ? Math.round(total[2] / coverage) : 0;
			pixels[offset + 3] = Math.round((coverage / sampleCount) * 255);
		}
	}
	return pixels;
}

export function encodePng(size: number, pixels: Uint8Array): Uint8Array {
	const rows = new Uint8Array(size * (size * 4 + 1));
	for (let row = 0; row < size; row++) {
		rows.set(pixels.subarray(row * size * 4, (row + 1) * size * 4), row * (size * 4 + 1) + 1);
	}
	const header = new Uint8Array(13);
	const headerView = new DataView(header.buffer);
	headerView.setUint32(0, size);
	headerView.setUint32(4, size);
	header[8] = 8;
	header[9] = PNG_COLOR_TYPE_RGBA;
	return concat([
		new Uint8Array(PNG_SIGNATURE),
		pngChunk("IHDR", header),
		pngChunk("IDAT", deflateSync(rows)),
		pngChunk("IEND", new Uint8Array(0)),
	]);
}

export async function writeIconset(folder: string): Promise<void> {
	await mkdir(folder, { recursive: true });
	for (const { name, size } of ICONSET_FILES) {
		await Bun.write(join(folder, name), encodePng(size, renderIcon(size)));
	}
}

function colorAt(point: Point): Color | null {
	if (roundedSquareDistance(point) > 0) {
		return null;
	}
	if (SPARKS.some(({ center, radius }) => isInSpark(point, center, radius))) {
		return SPARK_COLOR;
	}
	if (flameDistance(point, CORE) <= 0) {
		return CORE_COLOR;
	}
	if (flameDistance(point, FLAME) <= 0) {
		return gradientColor(Math.hypot(point.x - FLAME.base.x, point.y - (FLAME.base.y + 40)) / 330);
	}
	const vertical = (point.y - TILE.top) / TILE.size;
	const tile = mix(TILE_TOP_COLOR, TILE_BOTTOM_COLOR, vertical);
	const glow = Math.max(0, 1 - Math.hypot(point.x - GLOW.center.x, point.y - GLOW.center.y) / GLOW.radius) ** 2 * GLOW.strength;
	return mix(tile, GLOW.color, glow);
}

function roundedSquareDistance({ x, y }: Point): number {
	const half = TILE.size / 2;
	const dx = Math.abs(x - (TILE.left + half)) - (half - TILE.radius);
	const dy = Math.abs(y - (TILE.top + half)) - (half - TILE.radius);
	return Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0) - TILE.radius;
}

function flameDistance(point: Point, shape: { base: Point; baseRadius: number; height: number; tipRadius: number }): number {
	const x = Math.abs(point.x - shape.base.x);
	const y = shape.base.y - point.y;
	const slope = (shape.baseRadius - shape.tipRadius) / shape.height;
	const rise = Math.sqrt(1 - slope * slope);
	const along = -x * slope + y * rise;
	if (along < 0) {
		return Math.hypot(x, y) - shape.baseRadius;
	}
	if (along > rise * shape.height) {
		return Math.hypot(x, y - shape.height) - shape.tipRadius;
	}
	return x * rise + y * slope - shape.baseRadius;
}

function isInSpark(point: Point, center: Point, radius: number): boolean {
	return Math.sqrt(Math.abs(point.x - center.x) / radius) + Math.sqrt(Math.abs(point.y - center.y) / radius) <= 1;
}

function gradientColor(position: number): Color {
	const clamped = Math.min(Math.max(position, 0), 1);
	for (let index = 1; index < FLAME_STOPS.length; index++) {
		const [end, endColor] = FLAME_STOPS[index];
		const [start, startColor] = FLAME_STOPS[index - 1];
		if (clamped <= end) {
			return mix(startColor, endColor, (clamped - start) / (end - start));
		}
	}
	return FLAME_STOPS[FLAME_STOPS.length - 1][1];
}

function mix(from: Color, to: Color, amount: number): Color {
	return [0, 1, 2].map((channel) => from[channel] + (to[channel] - from[channel]) * amount) as Color;
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
	const typeBytes = new TextEncoder().encode(type);
	const chunk = new Uint8Array(12 + data.length);
	const view = new DataView(chunk.buffer);
	view.setUint32(0, data.length);
	chunk.set(typeBytes, 4);
	chunk.set(data, 8);
	view.setUint32(8 + data.length, Bun.hash.crc32(chunk.subarray(4, 8 + data.length)));
	return chunk;
}

function concat(parts: Uint8Array[]): Uint8Array {
	const result = new Uint8Array(parts.reduce((length, part) => length + part.length, 0));
	let offset = 0;
	for (const part of parts) {
		result.set(part, offset);
		offset += part.length;
	}
	return result;
}

if (import.meta.main) {
	await writeIconset(join(import.meta.dir, "..", "icon.iconset"));
}
