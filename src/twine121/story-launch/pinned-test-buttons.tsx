import {IconPlayerPlay} from '@tabler/icons';
import * as React from 'react';
import {useTranslation} from 'react-i18next';
import {IconButton} from '../../components/control/icon-button';
import {Story} from '../../store/stories';
import {useStoryLaunch} from '../../store/use-story-launch';
import {useCurrentPassageId} from './use-current-passage-id';
import './pinned-test-buttons.css';

export interface PinnedTestButtonsProps {
	story: Story;
}

/**
 * Always-visible test-launch buttons, pinned in the story-edit toolbar
 * regardless of which tab is selected. Testing is the highest-frequency
 * action for a story author, so these stay reachable without switching tabs.
 * "From Start" is always enabled--story.startPassage is guaranteed to
 * resolve to a real passage once a story has one (see the delete-passages
 * hotkey fix). "Current" reflects whichever passage editor is focused and
 * greys out when none is open.
 */
export const PinnedTestButtons: React.FC<PinnedTestButtonsProps> = props => {
	const {story} = props;
	const {testStory} = useStoryLaunch();
	const currentPassageId = useCurrentPassageId(story);
	const {t} = useTranslation();

	return (
		<div className="twine121-pinned-test-buttons">
			<IconButton
				icon={<IconPlayerPlay />}
				label={t('routes.storyEdit.toolbar.testFromStart')}
				onClick={() => testStory(story.id)}
			/>
			<IconButton
				disabled={!currentPassageId}
				icon={<IconPlayerPlay />}
				label={t('routes.storyEdit.toolbar.testCurrent')}
				onClick={() => {
					if (currentPassageId) {
						testStory(story.id, currentPassageId);
					}
				}}
			/>
		</div>
	);
};
