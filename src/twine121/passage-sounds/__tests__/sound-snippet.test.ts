import {soundName, soundSnippet} from '../sound-snippet';
import {StoryAsset} from '../../../electron/main-process/story-assets.types';

function soundAsset(name: string): StoryAsset {
	return {
		kind: 'sounds',
		name,
		relativePath: `sounds/${name}`,
		absolutePath: `/mock/story-folder/sounds/${name}`
	};
}

describe('soundName', () => {
	it('strips the extension and lowercases', () => {
		expect(soundName(soundAsset('Door.MP3'))).toBe('door');
	});

	it('collapses non-alphanumeric runs to single hyphens', () => {
		expect(soundName(soundAsset('Door Slam (loud).wav'))).toBe('door-slam-loud');
	});

	it('trims leading/trailing hyphens', () => {
		expect(soundName(soundAsset('__boom__.ogg'))).toBe('boom');
	});

	it('falls back to "sound" when nothing usable remains', () => {
		expect(soundName(soundAsset('___.mp3'))).toBe('sound');
	});
});

describe('soundSnippet', () => {
	describe('Harlowe', () => {
		it('plays with no options as a bare call', () => {
			expect(soundSnippet('door', 'harlowe', 'play')).toBe(
				"<script>SFX.play('door')</script>"
			);
		});

		it('includes loop, non-default volume, and stopAfter', () => {
			expect(
				soundSnippet('door', 'harlowe', 'play', {
					loop: true,
					volume: 0.6,
					stopAfter: 5
				})
			).toBe(
				"<script>SFX.play('door', {loop: true, volume: 0.6, stopAfter: 5})</script>"
			);
		});

		it('omits volume when it is 1 (full)', () => {
			expect(soundSnippet('door', 'harlowe', 'play', {volume: 1})).toBe(
				"<script>SFX.play('door')</script>"
			);
		});

		it('stops a sound', () => {
			expect(soundSnippet('music', 'harlowe', 'stop')).toBe(
				"<script>SFX.stop('music')</script>"
			);
		});
	});

	describe('Chapbook', () => {
		it('plays with no options as a bare insert', () => {
			expect(soundSnippet('door', 'chapbook', 'play')).toBe(
				"{play sound: 'door'}"
			);
		});

		it('includes loop, non-default volume, and stopAfter as insert props', () => {
			expect(
				soundSnippet('door', 'chapbook', 'play', {
					loop: true,
					volume: 0.6,
					stopAfter: 5
				})
			).toBe("{play sound: 'door', loop: true, volume: 0.6, stopAfter: 5}");
		});

		it('stops a sound', () => {
			expect(soundSnippet('music', 'chapbook', 'stop')).toBe(
				"{stop sound: 'music'}"
			);
		});
	});
});
