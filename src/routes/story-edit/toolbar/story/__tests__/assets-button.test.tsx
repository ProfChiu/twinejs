import {fireEvent, render, screen} from '@testing-library/react';
import {axe} from 'jest-axe';
import * as React from 'react';
import {useStoriesContext} from '../../../../../store/stories';
import {
	FakeStateProvider,
	FakeStateProviderProps
} from '../../../../../test-util';
import {isElectronRenderer} from '../../../../../util/is-electron';
import {AssetsButton} from '../assets-button';

jest.mock('../../../../../util/is-electron');

const TestAssetsButton: React.FC = () => {
	const {stories} = useStoriesContext();

	return <AssetsButton story={stories[0]} />;
};

describe('<AssetsButton>', () => {
	const isElectronRendererMock = isElectronRenderer as jest.Mock;

	function renderComponent(contexts?: FakeStateProviderProps) {
		return render(
			<FakeStateProvider {...contexts}>
				<TestAssetsButton />
			</FakeStateProvider>
		);
	}

	describe('in an Electron context', () => {
		beforeEach(() => isElectronRendererMock.mockReturnValue(true));

		it('opens the assets dialog when clicked', () => {
			renderComponent();
			fireEvent.click(screen.getByText('routes.storyEdit.toolbar.assets'));
			expect(
				screen.getByText('dialogs.storyAssets.title')
			).toBeInTheDocument();
		});

		it('is accessible', async () => {
			const {container} = renderComponent();

			expect(await axe(container)).toHaveNoViolations();
		});
	});

	describe('outside an Electron context', () => {
		beforeEach(() => isElectronRendererMock.mockReturnValue(false));

		it('renders nothing', () => {
			renderComponent();
			expect(
				screen.queryByText('routes.storyEdit.toolbar.assets')
			).not.toBeInTheDocument();
		});
	});
});
