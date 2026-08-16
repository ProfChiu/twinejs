import {fireEvent, render, screen} from '@testing-library/react';
import {axe} from 'jest-axe';
import * as React from 'react';
import {DialogsContext, DialogsContextProps} from '../../../dialogs/context';
import {PassageEditStack} from '../../../dialogs/passage-edit';
import {FakeStateProvider, fakeStory} from '../../../test-util';
import {useStoryLaunch} from '../../../store/use-story-launch';
import {PinnedTestButtons} from '../pinned-test-buttons';

jest.mock('../../../store/use-story-launch');

describe('<PinnedTestButtons>', () => {
	const useStoryLaunchMock = useStoryLaunch as jest.Mock;
	const story = fakeStory(2);
	let testStory: jest.Mock;

	beforeEach(() => {
		testStory = jest.fn();
		useStoryLaunchMock.mockReturnValue({testStory});
	});

	function renderComponent(context?: Partial<DialogsContextProps>) {
		return render(
			<FakeStateProvider>
				<DialogsContext.Provider
					value={{dialogs: [], dispatch: jest.fn(), ...context}}
				>
					<PinnedTestButtons story={story} />
				</DialogsContext.Provider>
			</FakeStateProvider>
		);
	}

	it('always enables the From Start button and launches without a passage id when clicked', () => {
		renderComponent();
		fireEvent.click(
			screen.getByText('routes.storyEdit.toolbar.testFromStart')
		);
		expect(testStory).toHaveBeenCalledWith(story.id);
	});

	it('disables the Current button when no passage editor is open', () => {
		renderComponent();
		expect(
			screen.getByText('routes.storyEdit.toolbar.testCurrent')
		).toBeDisabled();
	});

	it('enables the Current button and launches with the focused passage id when a passage editor is open', () => {
		renderComponent({
			dialogs: [
				{
					collapsed: false,
					component: PassageEditStack,
					highlighted: false,
					maximized: false,
					props: {
						storyId: story.id,
						passageIds: [story.passages[0].id]
					}
				}
			]
		});

		const button = screen.getByText('routes.storyEdit.toolbar.testCurrent');

		expect(button).not.toBeDisabled();
		fireEvent.click(button);
		expect(testStory).toHaveBeenCalledWith(story.id, story.passages[0].id);
	});

	it('is accessible', async () => {
		const {container} = renderComponent();

		expect(await axe(container)).toHaveNoViolations();
	});
});
