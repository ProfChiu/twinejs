import {fireEvent, render, screen} from '@testing-library/react';
import {axe} from 'jest-axe';
import * as React from 'react';
import {useStoriesContext} from '../../../store/stories';
import {FakeStateProvider, FakeStateProviderProps} from '../../../test-util';
import {isElectronRenderer} from '../../../util/is-electron';
import {AddPassageImageButton} from '../add-passage-image-button';

jest.mock('../../../util/is-electron');

const TestAddPassageImageButton: React.FC<{editor?: any}> = ({editor}) => {
	const {stories} = useStoriesContext();

	return (
		<AddPassageImageButton
			editor={editor}
			passage={stories[0].passages[0]}
			story={stories[0]}
		/>
	);
};

describe('<AddPassageImageButton>', () => {
	const isElectronRendererMock = isElectronRenderer as jest.Mock;
	let twineElectron: {importStoryAsset: jest.Mock};

	beforeEach(() => {
		twineElectron = {
			importStoryAsset: jest.fn().mockResolvedValue([
				{
					kind: 'images',
					name: 'cover.png',
					relativePath: 'images/cover.png',
					absolutePath: '/mock/images/cover.png'
				}
			])
		};
	});

	afterEach(() => {
		delete (window as any).twineElectron;
	});

	function renderComponent(
		contexts?: FakeStateProviderProps,
		editor?: any
	) {
		return render(
			<FakeStateProvider {...contexts}>
				<TestAddPassageImageButton editor={editor} />
			</FakeStateProvider>
		);
	}

	describe('outside an Electron context', () => {
		beforeEach(() => isElectronRendererMock.mockReturnValue(false));

		it('renders nothing', () => {
			renderComponent();
			expect(
				screen.queryByText('dialogs.passageEdit.addImage')
			).not.toBeInTheDocument();
		});
	});

	describe('in an Electron context', () => {
		beforeEach(() => {
			isElectronRendererMock.mockReturnValue(true);
			(window as any).twineElectron = twineElectron;
		});

		it('shows the four alignment options when opened', () => {
			renderComponent();
			fireEvent.click(
				screen.getByRole('button', {name: 'dialogs.passageEdit.addImage'})
			);
			expect(
				screen.getByText('dialogs.passageEdit.addImageAnchor')
			).toBeInTheDocument();
			expect(
				screen.getByText('dialogs.passageEdit.addImageFloatLeft')
			).toBeInTheDocument();
			expect(
				screen.getByText('dialogs.passageEdit.addImageFloatRight')
			).toBeInTheDocument();
			expect(
				screen.getByText('dialogs.passageEdit.addImageCentered')
			).toBeInTheDocument();
		});

		it('inserts at the cursor via the passed editor when an alignment is picked', async () => {
			const editor = {replaceSelection: jest.fn(), focus: jest.fn()};

			renderComponent(undefined, editor);
			fireEvent.click(
				screen.getByRole('button', {name: 'dialogs.passageEdit.addImage'})
			);
			fireEvent.click(
				screen.getByText('dialogs.passageEdit.addImageFloatLeft')
			);
			await new Promise(resolve => setTimeout(resolve, 0));
			expect(twineElectron.importStoryAsset).toHaveBeenCalled();
		});

		it('is accessible', async () => {
			const {container} = renderComponent();

			expect(await axe(container)).toHaveNoViolations();
		});
	});
});
