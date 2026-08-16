import {IconMusic} from '@tabler/icons';
import {Editor} from 'codemirror';
import * as React from 'react';
import {useTranslation} from 'react-i18next';
import {IconButton} from '../../components/control/icon-button';
import {Passage, Story} from '../../store/stories';
import {isElectronRenderer} from '../../util/is-electron';
import {SoundConsole, SoundConsolePosition} from './sound-console';

export interface AddPassageSoundButtonProps {
	disabled?: boolean;
	editor?: Editor;
	passage: Passage;
	story: Story;
}

/**
 * Toolbar button that opens the Sound Console for the currently-open passage.
 * Sits next to AddPassageImageButton and, like it, is Electron-only (the console
 * imports/lists sound files from the story's folder). A normal button click
 * rather than a right-click menu, for the same hardware-reliability reason noted
 * on AddPassageImageButton; the console has the passage's live CodeMirror
 * instance, so triggers insert at the cursor.
 */
export const AddPassageSoundButton: React.FC<
	AddPassageSoundButtonProps
> = props => {
	const {disabled, editor, passage, story} = props;
	const {t} = useTranslation();
	const [position, setPosition] = React.useState<SoundConsolePosition>();

	if (!isElectronRenderer()) {
		return null;
	}

	function handleOpen(event: React.MouseEvent) {
		const rect = event.currentTarget.getBoundingClientRect();

		// Anchor the popup just below the button. The console clamps its own
		// width to the viewport; vertical overflow is acceptable since the
		// toolbar sits near the top of the passage editor.
		setPosition({x: rect.left, y: rect.bottom + 4});
	}

	return (
		<>
			<IconButton
				disabled={disabled}
				icon={<IconMusic />}
				label={t('dialogs.passageEdit.addSound')}
				onClick={handleOpen}
			/>
			{position && (
				<SoundConsole
					editor={editor}
					onClose={() => setPosition(undefined)}
					passage={passage}
					position={position}
					story={story}
				/>
			)}
		</>
	);
};
