/**
 * @jest-environment jsdom
 */
import {mergeSoundLibrary} from '../install-sound-library';

it('real Howler + SFX wrapper load and expose the API without throwing', () => {
	const block = mergeSoundLibrary('', 'boom', 'sounds/boom.mp3');

	expect(() => {
		// Execute in a fresh function scope; Howler's UMD tail attaches to window.
		new Function(block)();
	}).not.toThrow();

	expect(typeof (window as any).Howl).toBe('function');
	expect((window as any).SFX).toBeDefined();
	expect(() => (window as any).SFX.define('x', 'sounds/x.mp3')).not.toThrow();
	expect(() => (window as any).SFX.stopAll()).not.toThrow();
	expect(() => (window as any).SFX.volume('master', 0.5)).not.toThrow();
});
