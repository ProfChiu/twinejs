import {IconLayout} from '@tabler/icons';
import * as React from 'react';
import {useTranslation} from 'react-i18next';
import {IconButton} from '../../../../components/control/icon-button';
import {useDialogsContext} from '../../../../dialogs';
import {Story} from '../../../../store/stories';
import {LayoutDesignerDialog} from '../../../../twine121/layout';

export interface LayoutButtonProps {
	story: Story;
}

export const LayoutButton: React.FC<LayoutButtonProps> = props => {
	const {story} = props;
	const {dispatch} = useDialogsContext();
	const {t} = useTranslation();

	return (
		<IconButton
			icon={<IconLayout />}
			label={t('routes.storyEdit.toolbar.layout')}
			onClick={() =>
				dispatch({
					type: 'addDialog',
					component: LayoutDesignerDialog,
					props: {storyId: story.id}
				})
			}
		/>
	);
};
