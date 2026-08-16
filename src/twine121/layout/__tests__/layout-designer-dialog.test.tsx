import {
	fireEvent,
	render,
	screen,
	waitFor,
	within
} from '@testing-library/react';
import {axe} from 'jest-axe';
import * as React from 'react';
import {useStoriesContext} from '../../../store/stories';
import {
	FakeStateProvider,
	FakeStateProviderProps,
	PrefInspector,
	StoryInspector,
	fakeStory
} from '../../../test-util';
import {isElectronRenderer} from '../../../util/is-electron';
import {LayoutDesignerDialog} from '../layout-designer-dialog';

jest.mock('../../../util/is-electron');

const TestLayoutDesignerDialog = () => {
	const {stories} = useStoriesContext();

	return (
		<LayoutDesignerDialog
			collapsed={false}
			onChangeCollapsed={jest.fn()}
			onChangeHighlighted={jest.fn()}
			onChangeMaximized={jest.fn()}
			onChangeProps={jest.fn()}
			onClose={jest.fn()}
			storyId={stories[0].id}
		/>
	);
};

describe('<LayoutDesignerDialog>', () => {
	const isElectronRendererMock = isElectronRenderer as jest.Mock;
	let twineElectron: {
		importStoryAsset: jest.Mock;
		listStoryAssets: jest.Mock;
		loadStorySidecar: jest.Mock;
		saveStorySidecar: jest.Mock;
	};

	beforeEach(() => {
		isElectronRendererMock.mockReturnValue(true);
		twineElectron = {
			importStoryAsset: jest.fn().mockResolvedValue([]),
			listStoryAssets: jest.fn().mockResolvedValue([]),
			loadStorySidecar: jest.fn().mockResolvedValue({}),
			saveStorySidecar: jest.fn().mockResolvedValue(undefined)
		};
		(window as any).twineElectron = twineElectron;
	});

	afterEach(() => {
		delete (window as any).twineElectron;
	});

	function renderComponent(contexts?: FakeStateProviderProps) {
		return render(
			<FakeStateProvider {...contexts}>
				<TestLayoutDesignerDialog />
				<StoryInspector />
				<PrefInspector name="customGoogleFonts" />
			</FakeStateProvider>
		);
	}

	it('displays a dialog that can be maximized', () => {
		renderComponent();
		expect(screen.getByLabelText('common.maximize')).toBeInTheDocument();
	});

	it('shows the preset, font, and dialogue box position controls', async () => {
		renderComponent();
		await waitFor(() =>
			expect(
				screen.getByLabelText('dialogs.layoutDesigner.presetLabel')
			).toBeInTheDocument()
		);
		expect(
			screen.getByLabelText('dialogs.layoutDesigner.fontLabel')
		).toBeInTheDocument();
		expect(
			screen.getByLabelText('dialogs.layoutDesigner.dialogueBoxPositionLabel')
		).toBeInTheDocument();
	});

	it('shows the anchor image gap control with a hint pointing at Images & Sounds', async () => {
		const story = fakeStory();

		story.storyFormat = 'Harlowe';
		renderComponent({stories: [story]});
		await waitFor(() =>
			expect(
				screen.getByLabelText('dialogs.layoutDesigner.anchorImageGapLabel')
			).toBeInTheDocument()
		);
		expect(
			screen.getByText('dialogs.layoutDesigner.anchorImageGapNote')
		).toBeInTheDocument();
	});

	it('applies a changed anchor image gap to the story stylesheet', async () => {
		const story = fakeStory();

		story.storyFormat = 'Harlowe';
		renderComponent({stories: [story]});
		await waitFor(() =>
			expect(
				screen.getByLabelText('dialogs.layoutDesigner.anchorImageGapLabel')
			).toBeInTheDocument()
		);
		fireEvent.change(
			screen.getByLabelText('dialogs.layoutDesigner.anchorImageGapLabel'),
			{target: {value: '55'}}
		);
		expect(
			screen.getByTestId('story-inspector-stylesheet-default')
		).toHaveTextContent('margin: 0 auto 55px;');
	});

	it('shows the Chapbook limitation note (not the anchor hint) on the gap control for a Chapbook story', async () => {
		const story = fakeStory();

		story.storyFormat = 'Chapbook';
		renderComponent({stories: [story]});
		await waitFor(() =>
			expect(
				screen.getByLabelText('dialogs.layoutDesigner.anchorImageGapLabel')
			).toBeInTheDocument()
		);
		expect(
			screen.queryByText('dialogs.layoutDesigner.anchorImageGapNote')
		).not.toBeInTheDocument();
		expect(
			screen.getAllByText('dialogs.layoutDesigner.chapbookLimitNote').length
		).toBeGreaterThan(0);
	});

	it('does not touch the story stylesheet just from being opened', async () => {
		renderComponent({stories: [{...fakeStory(), stylesheet: ''}]});
		await waitFor(() =>
			expect(
				screen.getByLabelText('dialogs.layoutDesigner.presetLabel')
			).toBeInTheDocument()
		);
		expect(
			screen.getByTestId('story-inspector-stylesheet-default')
		).toHaveTextContent('');
	});

	it('applies a new preset when picked, updating the story stylesheet', async () => {
		renderComponent();
		await waitFor(() =>
			expect(
				screen.getByLabelText('dialogs.layoutDesigner.presetLabel')
			).toBeInTheDocument()
		);
		fireEvent.change(
			screen.getByLabelText('dialogs.layoutDesigner.presetLabel'),
			{target: {value: 'centered-book'}}
		);
		expect(
			screen.getByTestId('story-inspector-stylesheet-default')
		).toHaveTextContent('#f8f5ef');
	});

	it('applies a changed text color to the story stylesheet', async () => {
		renderComponent();
		await waitFor(() =>
			expect(
				screen.getByLabelText('dialogs.layoutDesigner.textColorLabel')
			).toBeInTheDocument()
		);
		fireEvent.change(
			screen.getByLabelText('dialogs.layoutDesigner.textColorLabel'),
			{target: {value: '#123456'}}
		);
		expect(
			screen.getByTestId('story-inspector-stylesheet-default')
		).toHaveTextContent('#123456');
	});

	it("lists the story's own images as backdrop options", async () => {
		twineElectron.listStoryAssets.mockResolvedValue([
			{
				kind: 'images',
				name: 'bg.png',
				relativePath: 'images/bg.png',
				absolutePath: '/mock/images/bg.png'
			}
		]);
		renderComponent();
		await waitFor(() =>
			expect(
				screen.getByLabelText('dialogs.layoutDesigner.backdropImageLabel')
			).toBeInTheDocument()
		);
		expect(
			within(
				screen.getByLabelText('dialogs.layoutDesigner.backdropImageLabel')
			).getByText('bg.png')
		).toBeInTheDocument();
	});

	it("lists the story's own images as left panel options", async () => {
		twineElectron.listStoryAssets.mockResolvedValue([
			{
				kind: 'images',
				name: 'bg.png',
				relativePath: 'images/bg.png',
				absolutePath: '/mock/images/bg.png'
			}
		]);
		renderComponent();
		await waitFor(() =>
			expect(
				screen.getByLabelText('dialogs.layoutDesigner.leftPanelImageLabel')
			).toBeInTheDocument()
		);
		expect(
			within(
				screen.getByLabelText('dialogs.layoutDesigner.leftPanelImageLabel')
			).getByText('bg.png')
		).toBeInTheDocument();
	});

	it('imports a new image and sets it as the backdrop when chosen from the picker', async () => {
		const importedAsset = {
			kind: 'images',
			name: 'new-bg.png',
			relativePath: 'images/new-bg.png',
			absolutePath: '/mock/images/new-bg.png'
		};

		// importStoryAsset copies the file to disk; the subsequent refresh()
		// call (via listStoryAssets) is what a real filesystem scan would now
		// see, so the mock needs to reflect that too.
		twineElectron.importStoryAsset.mockImplementation(async () => {
			twineElectron.listStoryAssets.mockResolvedValue([importedAsset]);
			return [importedAsset];
		});
		renderComponent();
		await waitFor(() =>
			expect(
				screen.getByLabelText('dialogs.layoutDesigner.backdropImageLabel')
			).toBeInTheDocument()
		);
		fireEvent.change(
			screen.getByLabelText('dialogs.layoutDesigner.backdropImageLabel'),
			{target: {value: '__import_image__'}}
		);

		await waitFor(() =>
			expect(twineElectron.importStoryAsset).toHaveBeenCalledWith(
				expect.anything(),
				'images'
			)
		);
		await waitFor(() =>
			expect(
				within(
					screen.getByLabelText('dialogs.layoutDesigner.backdropImageLabel')
				).getByText('new-bg.png')
			).toBeInTheDocument()
		);
	});

	it('leaves the backdrop image unchanged if the import is canceled', async () => {
		twineElectron.importStoryAsset.mockResolvedValue([]);
		renderComponent();
		await waitFor(() =>
			expect(
				screen.getByLabelText('dialogs.layoutDesigner.backdropImageLabel')
			).toBeInTheDocument()
		);
		fireEvent.change(
			screen.getByLabelText('dialogs.layoutDesigner.backdropImageLabel'),
			{target: {value: '__import_image__'}}
		);

		await waitFor(() =>
			expect(twineElectron.importStoryAsset).toHaveBeenCalled()
		);
		expect(
			screen.getByLabelText('dialogs.layoutDesigner.backdropImageLabel')
		).toHaveValue('');
	});

	it('hides tw-sidebar in the story stylesheet when the sidebar checkbox is checked', async () => {
		renderComponent();
		await waitFor(() =>
			expect(
				screen.getByRole('checkbox', {
					name: 'dialogs.layoutDesigner.hideSidebarLabel'
				})
			).toBeInTheDocument()
		);
		expect(
			screen.getByTestId('story-inspector-stylesheet-default')
		).not.toHaveTextContent('tw-sidebar');

		fireEvent.click(
			screen.getByRole('checkbox', {
				name: 'dialogs.layoutDesigner.hideSidebarLabel'
			})
		);

		expect(
			screen.getByTestId('story-inspector-stylesheet-default')
		).toHaveTextContent('tw-sidebar { display: none !important; }');
	});

	it('hides tw-debugger in the story stylesheet when the debugger checkbox is checked', async () => {
		renderComponent();
		await waitFor(() =>
			expect(
				screen.getByRole('checkbox', {
					name: 'dialogs.layoutDesigner.hideDebuggerLabel'
				})
			).toBeInTheDocument()
		);
		fireEvent.click(
			screen.getByRole('checkbox', {
				name: 'dialogs.layoutDesigner.hideDebuggerLabel'
			})
		);

		expect(
			screen.getByTestId('story-inspector-stylesheet-default')
		).toHaveTextContent('tw-debugger { display: none !important; }');
	});

	it('aligns tw-passage to the left in the story stylesheet when the alignLeft checkbox is checked', async () => {
		renderComponent();
		await waitFor(() =>
			expect(
				screen.getByRole('checkbox', {
					name: 'dialogs.layoutDesigner.alignLeftLabel'
				})
			).toBeInTheDocument()
		);

		// The managed CSS block is only written once a control is actually
		// changed (the designer never stomps the stylesheet just from opening),
		// so we toggle alignLeft and then assert the left-aligned margin.
		fireEvent.click(
			screen.getByRole('checkbox', {
				name: 'dialogs.layoutDesigner.alignLeftLabel'
			})
		);

		expect(
			screen.getByTestId('story-inspector-stylesheet-default')
		).toHaveTextContent('margin: 0 auto 0 0px;');
	});

	it("shows a Chapbook limitation note when the story's format is Chapbook", async () => {
		const story = fakeStory();

		story.storyFormat = 'Chapbook';
		renderComponent({stories: [story]});
		await waitFor(() =>
			expect(
				screen.getAllByText('dialogs.layoutDesigner.chapbookLimitNote').length
			).toBeGreaterThan(0)
		);
	});

	it('does not show a Chapbook limitation note for a Harlowe story', async () => {
		const story = fakeStory();

		story.storyFormat = 'Harlowe';
		renderComponent({stories: [story]});
		await waitFor(() =>
			expect(
				screen.getByLabelText('dialogs.layoutDesigner.presetLabel')
			).toBeInTheDocument()
		);
		expect(
			screen.queryByText('dialogs.layoutDesigner.chapbookLimitNote')
		).not.toBeInTheDocument();
	});

	it('displays the three color fields in a row together', async () => {
		renderComponent();
		await waitFor(() =>
			expect(
				screen.getByLabelText('dialogs.layoutDesigner.textColorLabel')
			).toBeInTheDocument()
		);

		const row = screen
			.getByLabelText('dialogs.layoutDesigner.textColorLabel')
			.closest('.layout-color-row');

		expect(row).not.toBeNull();
		expect(
			within(row as HTMLElement).getByLabelText(
				'dialogs.layoutDesigner.backgroundColorLabel'
			)
		).toBeInTheDocument();
		expect(
			within(row as HTMLElement).getByLabelText(
				'dialogs.layoutDesigner.linkColorLabel'
			)
		).toBeInTheDocument();
	});

	it('applies a left panel width to the story stylesheet', async () => {
		const story = fakeStory();

		story.storyFormat = 'Harlowe';
		renderComponent({stories: [story]});
		await waitFor(() =>
			expect(
				screen.getByLabelText('dialogs.layoutDesigner.leftPanelWidthLabel')
			).toBeInTheDocument()
		);
		fireEvent.change(
			screen.getByLabelText('dialogs.layoutDesigner.leftPanelWidthLabel'),
			{target: {value: '280'}}
		);
		expect(
			screen.getByTestId('story-inspector-stylesheet-default')
		).toHaveTextContent('padding-left: 280px;');
	});

	it('omits left panel CSS when width is 0', async () => {
		const story = fakeStory();

		story.storyFormat = 'Harlowe';
		renderComponent({stories: [story]});
		await waitFor(() =>
			expect(
				screen.getByTestId('story-inspector-stylesheet-default')
			).toBeInTheDocument()
		);
		expect(
			screen.getByTestId('story-inspector-stylesheet-default')
		).not.toHaveTextContent('padding-left');
	});

	it('selecting the Character Panel preset sets a non-zero left panel width', async () => {
		const story = fakeStory();

		story.storyFormat = 'Harlowe';
		renderComponent({stories: [story]});
		await waitFor(() =>
			expect(
				screen.getByLabelText('dialogs.layoutDesigner.presetLabel')
			).toBeInTheDocument()
		);
		fireEvent.change(
			screen.getByLabelText('dialogs.layoutDesigner.presetLabel'),
			{target: {value: 'character-panel'}}
		);
		expect(
			screen.getByTestId('story-inspector-stylesheet-default')
		).toHaveTextContent('padding-left: 280px;');
	});

	it('adds a custom Google Font and saves it for reuse', async () => {
		renderComponent();
		await waitFor(() =>
			expect(
				screen.getByLabelText('dialogs.layoutDesigner.fontLabel')
			).toBeInTheDocument()
		);
		fireEvent.change(
			screen.getByLabelText('dialogs.layoutDesigner.fontLabel'),
			{
				target: {value: '__add_custom_font__'}
			}
		);
		fireEvent.change(
			screen.getByLabelText('dialogs.layoutDesigner.customFontNameLabel'),
			{target: {value: 'Roboto Slab'}}
		);
		fireEvent.change(
			screen.getByLabelText('dialogs.layoutDesigner.customFontFallbackLabel'),
			{target: {value: 'serif'}}
		);
		fireEvent.click(
			screen.getByText('dialogs.layoutDesigner.addCustomFontConfirm')
		);

		expect(
			screen.getByTestId('pref-inspector-customGoogleFonts')
		).toHaveTextContent('"Roboto Slab":"serif"');
		expect(
			screen.getByLabelText('dialogs.layoutDesigner.fontLabel')
		).toHaveValue('Roboto Slab');
	});

	it('auto-fills the font name when a Google Fonts URL is pasted', async () => {
		renderComponent();
		await waitFor(() =>
			expect(
				screen.getByLabelText('dialogs.layoutDesigner.fontLabel')
			).toBeInTheDocument()
		);
		fireEvent.change(
			screen.getByLabelText('dialogs.layoutDesigner.fontLabel'),
			{
				target: {value: '__add_custom_font__'}
			}
		);
		fireEvent.change(
			screen.getByLabelText('dialogs.layoutDesigner.customFontUrlLabel'),
			{
				target: {
					value: 'https://fonts.google.com/specimen/Playfair+Display'
				}
			}
		);

		expect(
			screen.getByLabelText('dialogs.layoutDesigner.customFontNameLabel')
		).toHaveValue('Playfair Display');
	});

	it('still allows the font name to be edited by hand after pasting a URL', async () => {
		renderComponent();
		await waitFor(() =>
			expect(
				screen.getByLabelText('dialogs.layoutDesigner.fontLabel')
			).toBeInTheDocument()
		);
		fireEvent.change(
			screen.getByLabelText('dialogs.layoutDesigner.fontLabel'),
			{
				target: {value: '__add_custom_font__'}
			}
		);
		fireEvent.change(
			screen.getByLabelText('dialogs.layoutDesigner.customFontUrlLabel'),
			{
				target: {
					value: 'https://fonts.google.com/specimen/Playfair+Display'
				}
			}
		);
		fireEvent.change(
			screen.getByLabelText('dialogs.layoutDesigner.customFontNameLabel'),
			{target: {value: 'Playfair Display SC'}}
		);

		expect(
			screen.getByLabelText('dialogs.layoutDesigner.customFontNameLabel')
		).toHaveValue('Playfair Display SC');
	});

	it('is accessible', async () => {
		const {container} = renderComponent();

		await waitFor(() =>
			expect(
				screen.getByLabelText('dialogs.layoutDesigner.presetLabel')
			).toBeInTheDocument()
		);
		expect(await axe(container)).toHaveNoViolations();
	});
});
