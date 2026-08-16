import {render} from '@testing-library/react';
import * as React from 'react';
import {DialogsContext, DialogsContextProps} from '../../../dialogs/context';
import {PassageEditStack} from '../../../dialogs/passage-edit';
import {FakeStateProvider, fakeStory} from '../../../test-util';
import {useCurrentPassageId} from '../use-current-passage-id';

describe('useCurrentPassageId()', () => {
	const story = fakeStory(2);

	function renderHook(context?: Partial<DialogsContextProps>) {
		let result: string | undefined;

		const TestComponent = () => {
			result = useCurrentPassageId(story);
			return null;
		};

		render(
			<FakeStateProvider>
				<DialogsContext.Provider
					value={{dialogs: [], dispatch: jest.fn(), ...context}}
				>
					<TestComponent />
				</DialogsContext.Provider>
			</FakeStateProvider>
		);

		return () => result;
	}

	it('returns undefined if no PassageEditStack dialog is open', () => {
		const getResult = renderHook({dialogs: []});

		expect(getResult()).toBeUndefined();
	});

	it('returns undefined if the open PassageEditStack belongs to a different story', () => {
		const getResult = renderHook({
			dialogs: [
				{
					collapsed: false,
					component: PassageEditStack,
					highlighted: false,
					maximized: false,
					props: {storyId: 'other-story', passageIds: [story.passages[0].id]}
				}
			]
		});

		expect(getResult()).toBeUndefined();
	});

	it('returns the front passage id of this story\'s PassageEditStack', () => {
		const getResult = renderHook({
			dialogs: [
				{
					collapsed: false,
					component: PassageEditStack,
					highlighted: false,
					maximized: false,
					props: {
						storyId: story.id,
						passageIds: [story.passages[1].id, story.passages[0].id]
					}
				}
			]
		});

		expect(getResult()).toBe(story.passages[1].id);
	});
});
