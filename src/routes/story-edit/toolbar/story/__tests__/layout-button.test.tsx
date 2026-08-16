import {fireEvent, render, screen} from '@testing-library/react';
import {axe} from 'jest-axe';
import * as React from 'react';
import {useStoriesContext} from '../../../../../store/stories';
import {
	FakeStateProvider,
	FakeStateProviderProps
} from '../../../../../test-util';
import {LayoutButton} from '../layout-button';

const TestLayoutButton: React.FC = () => {
	const {stories} = useStoriesContext();

	return <LayoutButton story={stories[0]} />;
};

describe('<LayoutButton>', () => {
	function renderComponent(contexts?: FakeStateProviderProps) {
		return render(
			<FakeStateProvider {...contexts}>
				<TestLayoutButton />
			</FakeStateProvider>
		);
	}

	it('opens the layout designer dialog when clicked', () => {
		renderComponent();
		fireEvent.click(screen.getByText('routes.storyEdit.toolbar.layout'));
		expect(
			screen.getByText('dialogs.layoutDesigner.title')
		).toBeInTheDocument();
	});

	it('is accessible', async () => {
		const {container} = renderComponent();

		expect(await axe(container)).toHaveNoViolations();
	});
});
