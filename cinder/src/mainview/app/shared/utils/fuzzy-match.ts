const CONSECUTIVE_BONUS = 4;
const WORD_START_BONUS = 6;
const SUBSTRING_BONUS = 10;
const PREFIX_BONUS = 8;
const GAP_PENALTY = 0.5;
const LENGTH_PENALTY = 0.05;
const WORD_SEPARATOR_PATTERN = /[^\p{L}\p{N}]/u;

/** Scores how well a query matches a text: every query character must appear in order, ignoring case and spaces. Returns null for no match; higher scores match better (word starts, runs, prefixes). */
export function fuzzyScore(query: string, text: string): number | null {
	const needle = [...query.toLocaleLowerCase()].filter((character) => character.trim() !== "");
	if (needle.length === 0) {
		return 0;
	}
	const haystack = [...text.toLocaleLowerCase()];
	let score = 0;
	let position = 0;
	let previousIndex = -2;
	for (const character of needle) {
		const index = haystack.indexOf(character, position);
		if (index === -1) {
			return null;
		}
		score += 1 - (index - position) * GAP_PENALTY;
		if (index === previousIndex + 1) {
			score += CONSECUTIVE_BONUS;
		}
		if (index === 0 || WORD_SEPARATOR_PATTERN.test(haystack[index - 1])) {
			score += WORD_START_BONUS;
		}
		previousIndex = index;
		position = index + 1;
	}
	const compactQuery = needle.join("");
	const lowerText = haystack.join("");
	if (lowerText.includes(compactQuery)) {
		score += SUBSTRING_BONUS;
	}
	if (lowerText.startsWith(compactQuery)) {
		score += PREFIX_BONUS;
	}
	return score - haystack.length * LENGTH_PENALTY;
}

/** Keeps the items whose text matches the query and sorts them best first; ties keep their order. Pass a function that returns each item's searchable text. */
export function rankByFuzzyScore<T>(items: readonly T[], query: string, textOf: (item: T) => string): T[] {
	return items
		.map((item, order) => ({ item, order, score: fuzzyScore(query, textOf(item)) }))
		.filter((entry): entry is { item: T; order: number; score: number } => entry.score !== null)
		.sort((first, second) => second.score - first.score || first.order - second.order)
		.map(({ item }) => item);
}
