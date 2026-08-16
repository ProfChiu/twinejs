import {
	MANAGED_SOUND_BEGIN,
	MANAGED_SOUND_END,
	extractSoundDefines,
	mergeSoundLibrary,
	removeManagedSoundBlock
} from '../install-sound-library';

function countOccurrences(haystack: string, needle: string): number {
	return haystack.split(needle).length - 1;
}

describe('mergeSoundLibrary', () => {
	it('installs the managed block with Howler, the SFX wrapper, and the define', () => {
		const result = mergeSoundLibrary('', 'door', 'sounds/door.mp3');

		expect(result).toContain(MANAGED_SOUND_BEGIN);
		expect(result).toContain(MANAGED_SOUND_END);
		expect(result).toContain('howler.js'); // vendored source header
		expect(result).toContain('window.SFX = (function');
		expect(result).toContain("SFX.define('door', 'sounds/door.mp3');");
	});

	it('produces syntactically valid JavaScript (compiles without executing)', () => {
		const result = mergeSoundLibrary('', 'door', 'sounds/door.mp3');

		// new Function() parses/compiles the body but does not run it, so this
		// validates the whole block's syntax--including the hand-written SFX
		// wrapper and Chapbook inserts--without invoking Howler's browser code.
		expect(() => new Function(result)).not.toThrow();
	});

	it('includes the first-gesture autoplay unlock (records pre-gesture plays and replays them)', () => {
		const result = mergeSoundLibrary('', 'door', 'sounds/door.mp3');

		expect(result).toContain('pendingUnlock');
		expect(result).toContain('onFirstGesture');
		// Eager, html5 Howl so preload runs and file:// loads via a media element.
		expect(result).toContain('preload: true, html5: true');
	});

	it('registers the Chapbook custom inserts (guarded, harmless in Harlowe)', () => {
		const result = mergeSoundLibrary('', 'door', 'sounds/door.mp3');

		expect(result).toContain("typeof engine !== 'undefined'");
		expect(result).toContain('/^play sound/i');
		expect(result).toContain('/^stop sound/i');
	});

	it('is idempotent: re-adding the same sound does not duplicate Howler', () => {
		const once = mergeSoundLibrary('', 'door', 'sounds/door.mp3');
		const twice = mergeSoundLibrary(once, 'door', 'sounds/door.mp3');

		expect(countOccurrences(twice, MANAGED_SOUND_BEGIN)).toBe(1);
		expect(countOccurrences(twice, 'window.SFX = (function')).toBe(1);
		expect(countOccurrences(twice, "SFX.define('door'")).toBe(1);
	});

	it('accumulates defines when adding a second, different sound', () => {
		const one = mergeSoundLibrary('', 'door', 'sounds/door.mp3');
		const two = mergeSoundLibrary(one, 'music', 'sounds/music.mp3');

		expect(two).toContain("SFX.define('door', 'sounds/door.mp3');");
		expect(two).toContain("SFX.define('music', 'sounds/music.mp3');");
		// Still a single Howler copy.
		expect(countOccurrences(two, 'window.SFX = (function')).toBe(1);
	});

	it('updates the path when the same name is re-added with a new file', () => {
		const one = mergeSoundLibrary('', 'door', 'sounds/door.mp3');
		const two = mergeSoundLibrary(one, 'door', 'sounds/door-v2.mp3');

		expect(two).toContain("SFX.define('door', 'sounds/door-v2.mp3');");
		expect(two).not.toContain("SFX.define('door', 'sounds/door.mp3');");
	});

	it('preserves hand-written Story JavaScript, placing the block on top', () => {
		const authorScript = 'window.myThing = 1;';
		const result = mergeSoundLibrary(authorScript, 'door', 'sounds/door.mp3');

		expect(result).toContain(authorScript);
		expect(result.indexOf(MANAGED_SOUND_BEGIN)).toBeLessThan(
			result.indexOf(authorScript)
		);
	});
});

describe('extractSoundDefines', () => {
	it('reads the name -> path registry back out of a managed script', () => {
		const script = mergeSoundLibrary(
			mergeSoundLibrary('', 'door', 'sounds/door.mp3'),
			'music',
			'sounds/music.mp3'
		);

		expect(extractSoundDefines(script)).toEqual({
			door: 'sounds/door.mp3',
			music: 'sounds/music.mp3'
		});
	});
});

describe('removeManagedSoundBlock', () => {
	it('removes the managed block and keeps the rest', () => {
		const script = mergeSoundLibrary(
			'window.keep = true;',
			'door',
			'sounds/door.mp3'
		);

		expect(removeManagedSoundBlock(script)).toBe('window.keep = true;');
	});

	it('leaves a script with no managed block untouched (trimmed)', () => {
		expect(removeManagedSoundBlock('  window.keep = true;  ')).toBe(
			'window.keep = true;'
		);
	});
});
