import * as React from 'react';
import {useDialogsContext} from '../../dialogs';
import {PassageEditStack} from '../../dialogs/passage-edit';
import {Story} from '../../store/stories';

/**
 * Returns the id of the passage whose editor is currently focused for this
 * story--the front card of the open PassageEditStack dialog--or undefined if
 * no passage editor is open. Index 0 of that dialog's passageIds is always
 * the focused editor (see addPassageEditors/onRaise in passage-edit-stack).
 */
export function useCurrentPassageId(story: Story): string | undefined {
	const {dialogs} = useDialogsContext();

	return React.useMemo(() => {
		const stack = dialogs.find(
			({component, props}) =>
				component === PassageEditStack && props?.storyId === story.id
		);

		return stack?.props?.passageIds?.[0];
	}, [dialogs, story.id]);
}
