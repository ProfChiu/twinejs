import {IconPhoto} from '@tabler/icons';
import * as React from 'react';
import {useTranslation} from 'react-i18next';
import {IconButton} from '../../../../components/control/icon-button';
import {useDialogsContext} from '../../../../dialogs';
import {Story} from '../../../../store/stories';
import {isElectronRenderer} from '../../../../util/is-electron';
import {StoryAssetsDialog} from '../../../../twine121/assets';

export interface AssetsButtonProps {
	story: Story;
}

/**
 * Opens the Twine121 images/sounds asset manager for a story. Only shown in
 * Electron--the dialog manages files on disk, which the browser build has no
 * access to.
 */
export const AssetsButton: React.FC<AssetsButtonProps> = props => {
	const {story} = props;
	const {dispatch} = useDialogsContext();
	const {t} = useTranslation();

	if (!isElectronRenderer()) {
		return null;
	}

	return (
		<IconButton
			icon={<IconPhoto />}
			label={t('routes.storyEdit.toolbar.assets')}
			onClick={() =>
				dispatch({
					type: 'addDialog',
					component: StoryAssetsDialog,
					props: {storyId: story.id}
				})
			}
		/>
	);
};
