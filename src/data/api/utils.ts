/**
 * Score a name match: higher = better match.
 * 2 = name starts with the search string
 * 1 = any word in the name starts with the search string
 * 0 = contains match only
 */
export function nameMatchScore(name: string, search: string): number {
  const lower = name.toLowerCase();
  if (lower.startsWith(search)) return 2;
  if (lower.split(/\s+/).some((word) => word.startsWith(search))) return 1;
  return 0;
}
