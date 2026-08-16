import {Editor} from 'codemirror';
import * as React from 'react';
import {isElectronRenderer} from '../../util/is-electron';
import {TwineElectronWindow} from '../../electron/shared';
import {StoryAsset} from '../../electron/main-process/story-assets.types';
import {
	Passage,
	Story,
	storyWithId,
	updatePassage,
	updateStory,
	useStoriesContext
} from '../../store/stories';
import {isChapbookFormat} from '../format';
import {mergeSoundLibrary} from './install-sound-library';
import {SoundAction, SoundOptions, soundName, soundSnippet} from './sound-snippet';

export interface AddSoundParams {
	asset: StoryAsset;
	action: SoundAction;
	options: SoundOptions;
}

export interface UseAddPassageSoundProps {
	/** False outside Electron, where there's no filesystem to import sounds
	 * from--callers should hide the UI entirely rather than show a dead action. */
	available: boolean;
	/** Ensures the Howler-backed sound library is installed in the story's Story
	 * JavaScript (idempotent) and inserts the play/stop trigger for the chosen
	 * sound. With a live CodeMirror editor the trigger is inserted at the cursor
	 * (the editor's own onBeforeChange wiring dispatches the passage update);
	 * without one it's appended to the passage's text. */
	addSound: (
		passage: Passage,
		params: AddSoundParams,
		editor?: Editor
	) => void;
}

export function useAddPassageSound(story: Story): UseAddPassageSoundProps {
	const {dispatch, stories} = useStoriesContext();
	const twineElectron = isElectronRenderer()
		? (window as TwineElectronWindow).twineElectron
		: undefined;

	const addSound = React.useCallback(
		(passage: Passage, params: AddSoundParams, editor?: Editor) => {
			const current = storyWithId(stories, story.id);
			const {asset, action, options} = params;
			const name = soundName(asset);
			const format = isChapbookFormat(current.storyFormat)
				? 'chapbook'
				: 'harlowe';

			// 1. Install/refresh the Howler library + register this sound in Story
			// JavaScript. Both formats need it--Harlowe runs the block via the
			// passage <script>, Chapbook via its custom inserts.
			dispatch(
				updateStory(stories, current, {
					script: mergeSoundLibrary(current.script, name, asset.relativePath)
				})
			);

			// 2. Insert the trigger where the author is working.
			const snippet = soundSnippet(name, format, action, options);

			if (editor) {
				editor.replaceSelection(`${snippet}\n`);
				editor.focus();
				return;
			}

			const newText = passage.text
				? `${passage.text}\n${snippet}`
				: snippet;

			dispatch(updatePassage(current, passage, {text: newText}));
		},
		[dispatch, stories, story.id]
	);

	return {addSound, available: !!twineElectron};
}
