/**
 * Rough heuristic for which format a story uses, matching the literal story
 * format name ("Harlowe" vs "Chapbook")--the only two formats Twine121's
 * layout/asset tooling has verified behavior for. Kept dependency-free (no
 * imports) so both twine121/assets and twine121/layout can use it without
 * depending on each other.
 */
export function isChapbookFormat(storyFormat: string): boolean {
	return storyFormat.toLowerCase().includes('chapbook');
}
