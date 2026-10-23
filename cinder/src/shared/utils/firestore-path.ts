/** Returns the parent of a collection or document path, or null for a root collection. Pass "users/dara" to get "users". */
export function parentPath(path: string): string | null {
	const index = path.lastIndexOf("/");
	return index < 0 ? null : path.slice(0, index);
}
