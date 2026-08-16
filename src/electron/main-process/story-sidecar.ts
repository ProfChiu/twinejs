import {readJson, writeJson} from 'fs-extra';
import {join} from 'path';
import {Story} from '../../store/stories/stories.types';
import {getStoryFolderPath} from './story-file';
import {StorySidecar} from './story-sidecar.types';

/**
 * Filename for a story's Twine121-specific metadata (layout designer tokens,
 * enabled JS libraries, upload target--added by later phases). Kept separate
 * from the story's own HTML/<tw-storydata> rather than as new story fields,
 * so it survives merges with upstream Twine untouched and never needs a
 * schema migration on the story format itself.
 */
export const SIDECAR_FILE_NAME = 'twine121.json';

function sidecarPath(story: Story) {
	return join(getStoryFolderPath(story), SIDECAR_FILE_NAME);
}

/**
 * Loads a story's sidecar data. Returns an empty object if the story has no
 * sidecar file yet (e.g. a story created before a Twine121 feature that uses
 * it existed) or if it can't be read.
 */
export async function loadStorySidecar(story: Story): Promise<StorySidecar> {
	try {
		return await readJson(sidecarPath(story));
	} catch (error) {
		return {};
	}
}

/**
 * Saves a story's sidecar data, overwriting whatever was there before.
 */
export async function saveStorySidecar(story: Story, data: StorySidecar) {
	await writeJson(sidecarPath(story), data);
}
