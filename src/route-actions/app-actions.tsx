import {
	IconAward,
	IconBug,
	IconFileCode,
	IconInfoCircle,
	IconRobot,
	IconSettings
} from '@tabler/icons';
import * as React from 'react';
import {useTranslation} from 'react-i18next';
import {useHistory} from 'react-router-dom';
import {ButtonBar} from '../components/container/button-bar';
import {IconButton} from '../components/control/icon-button';
import {AboutTwineDialog, AppPrefsDialog, useDialogsContext} from '../dialogs';
import {StoryFormatsDialog} from '../dialogs/story-formats/story-formats';
import {useStartupDialogContext} from '../twine121/about';

export const AppActions: React.FC = () => {
	const {dispatch} = useDialogsContext();
	const {openAiDisclaimer, openStartScreen} = useStartupDialogContext();
	const history = useHistory();
	const {t} = useTranslation();

	return (
		<ButtonBar>
			<IconButton
				icon={<IconInfoCircle />}
				label={t('twine121.startScreen.reopen')}
				onClick={openStartScreen}
			/>
			<IconButton
				icon={<IconRobot />}
				label={t('twine121.aiDisclaimer.title')}
				onClick={openAiDisclaimer}
			/>
			<IconButton
				icon={<IconSettings />}
				label={t('routeActions.app.preferences')}
				onClick={() => dispatch({type: 'addDialog', component: AppPrefsDialog})}
			/>
			<IconButton
				disabled={history.location.pathname === '/story-formats'}
				icon={<IconFileCode />}
				label={t('routeActions.app.storyFormats')}
				onClick={() =>
					dispatch({type: 'addDialog', component: StoryFormatsDialog})
				}
			/>
			<IconButton
				icon={<IconAward />}
				label={t('routeActions.app.aboutApp')}
				onClick={() =>
					dispatch({type: 'addDialog', component: AboutTwineDialog})
				}
			/>
			<IconButton
				icon={<IconBug />}
				label={t('routeActions.app.reportBug')}
				onClick={() => window.open('https://twinery.org/2bugs', '_blank')}
			/>
		</ButtonBar>
	);
};
