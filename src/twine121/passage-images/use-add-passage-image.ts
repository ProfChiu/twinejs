import {Editor} from 'codemirror';
import * as React from 'react';
import {isElectronRenderer} from '../../util/is-electron';
import {TwineElectronWindow} from '../../electron/shared';
import {Passage, Story, updatePassage} from '../../store/stories';
import {useUndoableStoriesContext} from '../../store/undoable-stories';
import {alignedImageSnippet, ImageAlignment} from './aligned-image';

export interface UseAddPassageImageProps {
	/** Whether this feature can work at all--false outside Electron, since it
	 * needs the native file picker. Callers should hide/disable any UI for
	 * this entirely when false rather than show an action that can't do
	 * anything. */
	available: boolean;
	/** Adds one or more images to a passage. If a live CodeMirror editor
	 * instance for that passage is passed, the snippet is inserted at the
	 * cursor via replaceSelection()--the editor's own onBeforeChange wiring
	 * (see CodeArea) picks this up and dispatches the update automatically,
	 * the same as if the student had typed it, so no separate dispatch
	 * happens in that path. Without an editor (e.g. the passage isn't
	 * currently open), the snippet is appended to the end of the passage's
	 * text instead. */
	addImage: (
		passage: Passage,
		alignment: ImageAlignment,
		editor?: Editor
	) => Promise<void>;
}

/**
 * Provides a function to add one or more images to a passage: shows the
 * native file picker (reusing the same import used by the Images & Sounds
 * panel), then inserts HTML for each chosen file--styled per the requested
 * alignment.
 */
export function useAddPassageImage(story: Story): UseAddPassageImageProps {
	const {dispatch} = useUndoableStoriesContext();
	const twineElectron = isElectronRenderer()
		? (window as TwineElectronWindow).twineElectron
		: undefined;

	const addImage = React.useCallback(
		async (passage: Passage, alignment: ImageAlignment, editor?: Editor) => {
			if (!twineElectron) {
				return;
			}

			const imported = await twineElectron.importStoryAsset(story, 'images');

			if (imported.length === 0) {
				// User canceled the file picker.
				return;
			}

			const snippet = imported
				.map(asset => alignedImageSnippet(asset, alignment))
				.join('\n');

			if (editor) {
				editor.replaceSelection(`${snippet}\n`);
				editor.focus();
				return;
			}

			const newText = passage.text ? `${passage.text}\n${snippet}` : snippet;

			dispatch(
				updatePassage(story, passage, {text: newText}),
				'undoChange.addPassageImage'
			);
		},
		[dispatch, story, twineElectron]
	);

	return {addImage, available: !!twineElectron};
}
