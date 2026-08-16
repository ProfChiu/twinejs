import {IMAGE_ALIGNMENTS, alignedImageSnippet} from '../aligned-image';
import {StoryAsset} from '../../../electron/main-process/story-assets.types';

describe('alignedImageSnippet', () => {
	const asset: StoryAsset = {
		kind: 'images',
		name: 'cover.png',
		relativePath: 'images/cover.png',
		absolutePath: '/mock/story-folder/images/cover.png'
	};

	it('produces class="scene" markup for anchor, matching the Images & Sounds panel', () => {
		expect(alignedImageSnippet(asset, 'anchor')).toBe(
			'<img class="scene" src="images/cover.png">'
		);
	});

	it('produces a float:left inline style for float-left', () => {
		const html = alignedImageSnippet(asset, 'float-left');

		expect(html).toContain('float:left');
		expect(html).toContain('src="images/cover.png"');
	});

	it('produces a float:right inline style for float-right', () => {
		const html = alignedImageSnippet(asset, 'float-right');

		expect(html).toContain('float:right');
	});

	it('produces a centered block inline style for centered', () => {
		const html = alignedImageSnippet(asset, 'centered');

		expect(html).toContain('display:block');
		expect(html).toContain('margin: 12px auto;');
	});

	it('always references the exact relative path, for every alignment', () => {
		for (const alignment of IMAGE_ALIGNMENTS) {
			expect(alignedImageSnippet(asset, alignment)).toContain(
				'src="images/cover.png"'
			);
		}
	});
});
