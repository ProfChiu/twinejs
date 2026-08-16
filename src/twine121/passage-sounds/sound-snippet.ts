import {StoryAsset} from '../../electron/main-process/story-assets.types';

export type SoundAction = 'play' | 'stop';

export type SoundFormat = 'harlowe' | 'chapbook';

export interface SoundOptions {
	/** Loop the sound until stopped. Default false (play once). */
	loop?: boolean;
	/** 0..1. Omitted or 1 => full volume, no explicit volume emitted. */
	volume?: number;
	/** Seconds. Omitted/0 => no timed stop. */
	stopAfter?: number;
}

/**
 * Derives the short, stable nickname a sound is registered and referenced by
 * (e.g. "Door Slam.mp3" -> "door-slam"). Lowercased, extension stripped,
 * non-alphanumeric runs collapsed to single hyphens. Both the SFX.define()
 * line in Story JavaScript and the trigger call use this, so they always agree.
 */
export function soundName(asset: StoryAsset): string {
	const base = asset.name.replace(/\.[^.]+$/, '');
	const clean = base
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');

	return clean || 'sound';
}

function playOptionParts(options: SoundOptions): string[] {
	const parts: string[] = [];

	if (options.loop) {
		parts.push('loop: true');
	}

	if (typeof options.volume === 'number' && options.volume !== 1) {
		parts.push(`volume: ${options.volume}`);
	}

	if (options.stopAfter) {
		parts.push(`stopAfter: ${options.stopAfter}`);
	}

	return parts;
}

/**
 * Builds the trigger to insert at the cursor, in the given format. Harlowe runs
 * a raw <script> in passage prose; Chapbook uses the custom {play sound}/{stop
 * sound} inserts registered in Story JavaScript (see install-sound-library.ts).
 * Both call the same window.SFX API, so behavior is identical across formats.
 */
export function soundSnippet(
	name: string,
	format: SoundFormat,
	action: SoundAction,
	options: SoundOptions = {}
): string {
	if (action === 'stop') {
		return format === 'chapbook'
			? `{stop sound: '${name}'}`
			: `<script>SFX.stop('${name}')</script>`;
	}

	const parts = playOptionParts(options);

	if (format === 'chapbook') {
		const props = parts.length ? `, ${parts.join(', ')}` : '';

		return `{play sound: '${name}'${props}}`;
	}

	const optObj = parts.length ? `, {${parts.join(', ')}}` : '';

	return `<script>SFX.play('${name}'${optObj})</script>`;
}
