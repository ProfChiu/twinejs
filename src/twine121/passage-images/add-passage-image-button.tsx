import {IconPhoto} from '@tabler/icons';
import {Editor} from 'codemirror';
import * as React from 'react';
import {useTranslation} from 'react-i18next';
import {MenuButton} from '../../components/control/menu-button';
import {Passage, Story} from '../../store/stories';
import {IMAGE_ALIGNMENTS, ImageAlignment} from './aligned-image';
import {useAddPassageImage} from './use-add-passage-image';

export interface AddPassageImageButtonProps {
	disabled?: boolean;
	editor?: Editor;
	passage: Passage;
	story: Story;
}

const LABEL_KEY_BY_ALIGNMENT: Record<ImageAlignment, string> = {
	anchor: 'dialogs.passageEdit.addImageAnchor',
	'float-left': 'dialogs.passageEdit.addImageFloatLeft',
	'float-right': 'dialogs.passageEdit.addImageFloatRight',
	centered: 'dialogs.passageEdit.addImageCentered'
};

/**
 * Toolbar button for adding an image to the currently-open passage. Uses the
 * existing, already-shipped MenuButton for its dropdown rather than a custom
 * popup--right-clicking a passage card on the story map (an earlier attempt
 * at this feature) turned out to be unreliable for real hardware right-clicks
 * in Electron, confirmed by the professor's own testing, so this lives here
 * instead: a normal button click, with real cursor-position insertion since
 * this toolbar has the passage's live CodeMirror instance.
 */
export const AddPassageImageButton: React.FC<
	AddPassageImageButtonProps
> = props => {
	const {disabled, editor, passage, story} = props;
	const {addImage, available} = useAddPassageImage(story);
	const {t} = useTranslation();

	if (!available) {
		return null;
	}

	return (
		<MenuButton
			disabled={disabled}
			icon={<IconPhoto />}
			items={IMAGE_ALIGNMENTS.map(alignment => ({
				label: t(LABEL_KEY_BY_ALIGNMENT[alignment]),
				onClick: () => addImage(passage, alignment, editor)
			}))}
			label={t('dialogs.passageEdit.addImage')}
		/>
	);
};
