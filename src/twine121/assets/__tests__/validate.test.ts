import {checkAssetReferences} from '../validate';
import {fakePassage, fakeStory} from '../../../test-util';
import {StoryAsset} from '../../../electron/main-process/story-assets.types';

describe('checkAssetReferences', () => {
	const existingImage: StoryAsset = {
		kind: 'images',
		name: 'cover.png',
		relativePath: 'images/cover.png',
		absolutePath: '/mock/story-folder/images/cover.png'
	};
	const existingSound: StoryAsset = {
		kind: 'sounds',
		name: 'theme.mp3',
		relativePath: 'sounds/theme.mp3',
		absolutePath: '/mock/story-folder/sounds/theme.mp3'
	};

	function storyWithPassageText(text: string) {
		const passage = fakePassage({text, name: 'Mock Passage'});

		return {...fakeStory(0), passages: [passage], stylesheet: ''};
	}

	it('has no issues for a hosted http(s) image reference', () => {
		const story = storyWithPassageText(
			'<img src="https://example.com/cover.png">'
		);

		expect(checkAssetReferences(story, [])).toEqual([]);
	});

	it('has no issues for a protocol-relative or data: reference', () => {
		const story = storyWithPassageText(
			'<img src="//example.com/cover.png"><img src="data:image/png;base64,AAAA">'
		);

		expect(checkAssetReferences(story, [])).toEqual([]);
	});

	it('has no issues for a local reference that matches an existing asset', () => {
		const story = storyWithPassageText('<img src="images/cover.png">');

		expect(checkAssetReferences(story, [existingImage])).toEqual([]);
	});

	it('flags a local images/ reference with no matching asset as missing', () => {
		const story = storyWithPassageText('<img src="images/missing.png">');

		expect(checkAssetReferences(story, [existingImage])).toEqual([
			{type: 'missing', path: 'images/missing.png', passageName: 'Mock Passage'}
		]);
	});

	it('flags a local sounds/ reference with no matching asset as missing', () => {
		const story = storyWithPassageText(
			'<audio src="sounds/missing.mp3"></audio>'
		);

		expect(checkAssetReferences(story, [existingSound])).toEqual([
			{
				type: 'missing',
				path: 'sounds/missing.mp3',
				passageName: 'Mock Passage'
			}
		]);
	});

	it('flags a local reference outside images/sounds', () => {
		const story = storyWithPassageText('<img src="art/cover.png">');

		expect(checkAssetReferences(story, [])).toEqual([
			{
				type: 'outsideAssetsFolder',
				path: 'art/cover.png',
				passageName: 'Mock Passage'
			}
		]);
	});

	it('finds CSS url() references in passage text', () => {
		const story = storyWithPassageText(
			'<div style="background-image:url(images/missing.png)"></div>'
		);

		expect(checkAssetReferences(story, [])).toEqual([
			{
				type: 'missing',
				path: 'images/missing.png',
				passageName: 'Mock Passage'
			}
		]);
	});

	it('finds CSS url() references in the story stylesheet, with no passage name', () => {
		const story = {
			...fakeStory(0),
			passages: [],
			stylesheet: 'tw-story { background-image: url(images/missing.png); }'
		};

		expect(checkAssetReferences(story, [])).toEqual([
			{type: 'missing', path: 'images/missing.png'}
		]);
	});

	it('finds multiple references across multiple passages', () => {
		const story = fakeStory(0);

		story.passages = [
			fakePassage({name: 'A', text: '<img src="images/missing-1.png">'}),
			fakePassage({name: 'B', text: '<img src="images/missing-2.png">'})
		];
		story.stylesheet = '';

		const issues = checkAssetReferences(story, []);

		expect(issues).toHaveLength(2);
		expect(issues.map(issue => issue.passageName).sort()).toEqual(['A', 'B']);
	});

	it('returns no issues for a story with no local references', () => {
		const story = storyWithPassageText('Just some plain passage text.');

		expect(checkAssetReferences(story, [])).toEqual([]);
	});
});
