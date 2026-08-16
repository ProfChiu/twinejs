import {usePublishing} from './use-publishing';
import {isElectronRenderer} from '../util/is-electron';
import {TwineElectronWindow} from '../electron/shared';
import {storyWithId, useStoriesContext} from './stories';

export interface UseStoryLaunchProps {
	playStory: (storyId: string) => Promise<void>;
	proofStory: (storyId: string) => Promise<void>;
	testStory: (storyId: string, startPassageId?: string) => Promise<void>;
}

/**
 * Provides functions to launch a story that include the correct handling for
 * both web and Electron contexts.
 */
export function useStoryLaunch(): UseStoryLaunchProps {
	const {proofStory, publishStory} = usePublishing();
	const {stories} = useStoriesContext();

	if (isElectronRenderer()) {
		const {twineElectron} = window as TwineElectronWindow;

		if (!twineElectron) {
			throw new Error('Electron bridge is not present on window.');
		}

		// These are async to match the type in the browser context.

		return {
			playStory: async storyId => {
				twineElectron.openWithScratchFile(
					await publishStory(storyId),
					storyWithId(stories, storyId)
				);
			},
			proofStory: async storyId => {
				twineElectron.openWithScratchFile(
					await proofStory(storyId),
					storyWithId(stories, storyId)
				);
			},
			testStory: async (storyId, startPassageId) => {
				twineElectron.openWithScratchFile(
					await publishStory(storyId, {
						formatOptions: 'debug',
						startId: startPassageId
					}),
					storyWithId(stories, storyId)
				);
			}
		};
	}

	return {
		playStory: async storyId => {
			window.open(`#/stories/${storyId}/play`, '_blank');
		},
		proofStory: async storyId => {
			window.open(`#/stories/${storyId}/proof`, '_blank');
		},
		testStory: async (storyId, startPassageId) => {
			window.open(
				startPassageId
					? `#/stories/${storyId}/test/${startPassageId}`
					: `#/stories/${storyId}/test`,
				'_blank'
			);
		}
	};
}
