import {fireEvent, render, screen} from '@testing-library/react';
import {axe} from 'jest-axe';
import * as React from 'react';
import {useStoriesContext} from '../../../store/stories';
import {FakeStateProvider, FakeStateProviderProps} from '../../../test-util';
import {isElectronRenderer} from '../../../util/is-electron';
import {AddPassageSoundButton} from '../add-passage-sound-button';

jest.mock('../../../util/is-electron');

const TestAddPassageSoundButton: React.FC<{editor?: any}> = ({editor}) => {
	const {stories} = useStoriesContext();

	return (
		<AddPassageSoundButton
			editor={editor}
			passage={stories[0].passages[0]}
			story={stories[0]}
		/>
	);
};

describe('<AddPassageSoundButton>', () => {
	const isElectronRendererMock = isElectronRenderer as jest.Mock;
	let twineElectron: {
		importStoryAsset: jest.Mock;
		listStoryAssets: jest.Mock;
	};

	beforeEach(() => {
		twineElectron = {
			importStoryAsset: jest.fn().mockResolvedValue([]),
			listStoryAssets: jest.fn().mockResolvedValue([
				{
					kind: 'sounds',
					name: 'boom.mp3',
					relativePath: 'sounds/boom.mp3',
					absolutePath: '/mock/sounds/boom.mp3'
				}
			])
		};
	});

	afterEach(() => {
		delete (window as any).twineElectron;
	});

	function renderComponent(contexts?: FakeStateProviderProps, editor?: any) {
		return render(
			<FakeStateProvider {...contexts}>
				<TestAddPassageSoundButton editor={editor} />
			</FakeStateProvider>
		);
	}

	describe('outside an Electron context', () => {
		beforeEach(() => isElectronRendererMock.mockReturnValue(false));

		it('renders nothing', () => {
			renderComponent();
			expect(
				screen.queryByRole('button', {name: 'dialogs.passageEdit.addSound'})
			).not.toBeInTheDocument();
		});
	});

	describe('in an Electron context', () => {
		beforeEach(() => {
			isElectronRendererMock.mockReturnValue(true);
			(window as any).twineElectron = twineElectron;
		});

		it('opens the Sound Console when clicked', () => {
			renderComponent();
			fireEvent.click(
				screen.getByRole('button', {name: 'dialogs.passageEdit.addSound'})
			);
			expect(
				screen.getByRole('heading', {name: 'dialogs.passageEdit.addSound'})
			).toBeInTheDocument();
			expect(
				screen.getByText('dialogs.passageEdit.addSoundAction')
			).toBeInTheDocument();
		});

		it('lists the story\'s imported sounds', async () => {
			renderComponent();
			fireEvent.click(
				screen.getByRole('button', {name: 'dialogs.passageEdit.addSound'})
			);
			expect(
				await screen.findByRole('option', {name: 'boom.mp3'})
			).toBeInTheDocument();
		});

		it('inserts a play trigger at the cursor when Insert is clicked', async () => {
			const editor = {replaceSelection: jest.fn(), focus: jest.fn()};

			renderComponent(undefined, editor);
			fireEvent.click(
				screen.getByRole('button', {name: 'dialogs.passageEdit.addSound'})
			);
			// Wait for the sound list to load and auto-select.
			await screen.findByRole('option', {name: 'boom.mp3'});
			fireEvent.click(
				screen.getByRole('button', {name: 'dialogs.passageEdit.addSoundInsert'})
			);
			expect(editor.replaceSelection).toHaveBeenCalledTimes(1);

			const inserted = editor.replaceSelection.mock.calls[0][0] as string;

			expect(inserted).toContain('boom');
			// Either Harlowe <script>SFX.play(...)</script> or Chapbook {play sound}.
			expect(inserted).toMatch(/SFX\.play|play sound/);
		});

		it('closes the console after inserting', async () => {
			const editor = {replaceSelection: jest.fn(), focus: jest.fn()};

			renderComponent(undefined, editor);
			fireEvent.click(
				screen.getByRole('button', {name: 'dialogs.passageEdit.addSound'})
			);
			await screen.findByRole('option', {name: 'boom.mp3'});
			fireEvent.click(
				screen.getByRole('button', {name: 'dialogs.passageEdit.addSoundInsert'})
			);
			expect(
				screen.queryByRole('heading', {name: 'dialogs.passageEdit.addSound'})
			).not.toBeInTheDocument();
		});

		it('is accessible', async () => {
			const {container} = renderComponent();

			expect(await axe(container)).toHaveNoViolations();
		});
	});
});
