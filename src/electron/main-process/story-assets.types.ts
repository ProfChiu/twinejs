// Kept separate from story-assets.ts (which imports electron's dialog/shell
// and fs-extra) so this can be imported by shared/renderer code without
// pulling Node/Electron runtime code into the web bundle. See
// stories.types.ts for the established convention this follows.

export type StoryAssetKind = 'images' | 'sounds';

export interface StoryAsset {
	kind: StoryAssetKind;
	name: string;
	/** Path relative to the story's own folder, e.g. "images/cover.png"--this
	 * is what should be inserted into passage text so it resolves the same
	 * way during preview and after publishing. */
	relativePath: string;
	/** Absolute filesystem path--for renderer-side previews (e.g. showing a
	 * picked backdrop image) that can't resolve a relative path on their own,
	 * since the renderer's origin isn't the story's folder. Never insert this
	 * into passage text--use relativePath for that. */
	absolutePath: string;
}
