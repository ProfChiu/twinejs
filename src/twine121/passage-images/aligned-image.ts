import {StoryAsset} from '../../electron/main-process/story-assets.types';

export type ImageAlignment = 'anchor' | 'float-left' | 'float-right' | 'centered';

export const IMAGE_ALIGNMENTS: ImageAlignment[] = [
	'anchor',
	'float-left',
	'float-right',
	'centered'
];

/**
 * Returns HTML for inserting an image into a passage with the given
 * alignment. Confirmed live (not assumed) that raw HTML with inline styles
 * renders correctly in both Harlowe and Chapbook--Chapbook doesn't strip or
 * escape it--so unlike the Images & Sounds panel's anchor insert, this needs
 * no per-format branching. "anchor" reuses the same class="scene" markup as
 * that panel (see story-assets-dialog.tsx) so an image inserted either way
 * behaves identically and both respect the Layout Designer's Anchor Image
 * Gap control; the other three alignments are plain inline CSS, deliberately
 * not styled through the Layout Designer since they're a per-image choice,
 * not a story-wide setting.
 */
export function alignedImageSnippet(
	asset: StoryAsset,
	alignment: ImageAlignment
): string {
	switch (alignment) {
		case 'anchor':
			return `<img class="scene" src="${asset.relativePath}">`;

		case 'float-left':
			return `<img style="float:left; margin: 0 12px 12px 0;" src="${asset.relativePath}">`;

		case 'float-right':
			return `<img style="float:right; margin: 0 0 12px 12px;" src="${asset.relativePath}">`;

		case 'centered':
			return `<img style="display:block; margin: 12px auto;" src="${asset.relativePath}">`;
	}
}
