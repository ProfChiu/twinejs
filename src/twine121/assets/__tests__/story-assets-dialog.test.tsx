import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {axe} from 'jest-axe';
import * as React from 'react';
import {useStoriesContext} from '../../../store/stories';
import {
	FakeStateProvider,
	FakeStateProviderProps,
	fakeStory
} from '../../../test-util';
import {isElectronRenderer} from '../../../util/is-electron';
import {StoryAssetsDialog} from '../story-assets-dialog';

jest.mock('../../../util/is-electron');

const TestStoryAssetsDialog = () => {
	const {stories} = useStoriesContext();

	return (
		<StoryAssetsDialog
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

describe('<StoryAssetsDialog>', () => {
	const isElectronRendererMock = isElectronRenderer as jest.Mock;
	let twineElectron: {
		deleteStoryAsset: jest.Mock;
		importStoryAsset: jest.Mock;
		listStoryAssets: jest.Mock;
		revealStoryAsset: jest.Mock;
	};

	beforeEach(() => {
		isElectronRendererMock.mockReturnValue(true);
		twineElectron = {
			deleteStoryAsset: jest.fn().mockResolvedValue(undefined),
			importStoryAsset: jest.fn().mockResolvedValue([]),
			listStoryAssets: jest.fn().mockResolvedValue([]),
			revealStoryAsset: jest.fn().mockResolvedValue(undefined)
		};
		(window as any).twineElectron = twineElectron;
		Object.defineProperty(window.navigator, 'clipboard', {
			configurable: true,
			value: {writeText: jest.fn().mockResolvedValue(undefined)}
		});
	});

	afterEach(() => {
		delete (window as any).twineElectron;
	});

	function renderComponent(contexts?: FakeStateProviderProps) {
		return render(
			<FakeStateProvider {...contexts}>
				<TestStoryAssetsDialog />
			</FakeStateProvider>
		);
	}

	it("shows empty-state messages when the story has no images or sounds", async () => {
		renderComponent();
		expect(
			await screen.findByText('dialogs.storyAssets.noImages')
		).toBeInTheDocument();
		expect(
			screen.getByText('dialogs.storyAssets.noSounds')
		).toBeInTheDocument();
	});

	it('imports an image when the import image button is clicked', async () => {
		renderComponent();
		await screen.findByText('dialogs.storyAssets.noImages');
		fireEvent.click(
			screen.getByRole('button', {name: 'dialogs.storyAssets.importImage'})
		);
		await waitFor(() =>
			expect(twineElectron.importStoryAsset).toHaveBeenCalledWith(
				expect.anything(),
				'images'
			)
		);
	});

	describe('with an existing image asset', () => {
		beforeEach(() => {
			twineElectron.listStoryAssets.mockResolvedValue([
				{kind: 'images', name: 'cover.png', relativePath: 'images/cover.png'}
			]);
		});

		it('lists the asset by name', async () => {
			renderComponent();
			expect(await screen.findByText('cover.png')).toBeInTheDocument();
		});

		it('copies HTML markup referencing the asset when Insert is clicked', async () => {
			renderComponent();
			await screen.findByText('cover.png');
			fireEvent.click(
				screen.getByRole('button', {name: 'dialogs.storyAssets.insert'})
			);
			await waitFor(() =>
				expect(window.navigator.clipboard.writeText).toHaveBeenCalledWith(
					'<img src="images/cover.png">'
				)
			);
		});

		it('reveals the asset in the file browser when Reveal is clicked', async () => {
			renderComponent();
			await screen.findByText('cover.png');
			fireEvent.click(
				screen.getByRole('button', {name: 'dialogs.storyAssets.reveal'})
			);
			await waitFor(() =>
				expect(twineElectron.revealStoryAsset).toHaveBeenCalledWith(
					expect.anything(),
					'images',
					'cover.png'
				)
			);
		});

		it('deletes the asset after confirming', async () => {
			renderComponent();
			await screen.findByText('cover.png');
			fireEvent.click(
				screen.getByRole('button', {name: 'dialogs.storyAssets.delete'})
			);
			fireEvent.click(
				await screen.findByText('dialogs.storyAssets.delete', {
					selector: '.card-button-card button'
				})
			);
			await waitFor(() =>
				expect(twineElectron.deleteStoryAsset).toHaveBeenCalledWith(
					expect.anything(),
					'images',
					'cover.png'
				)
			);
		});

		it('copies class="scene" anchor markup for a Harlowe story when Insert as Anchor is clicked', async () => {
			const story = fakeStory();

			story.storyFormat = 'Harlowe';
			renderComponent({stories: [story]});
			await screen.findByText('cover.png');
			fireEvent.click(
				screen.getByRole('button', {name: 'dialogs.storyAssets.insertAnchor'})
			);
			await waitFor(() =>
				expect(window.navigator.clipboard.writeText).toHaveBeenCalledWith(
					'<img class="scene" src="images/cover.png">'
				)
			);
		});

		it('copies a Chapbook {embed image:...} insert for a Chapbook story when Insert as Anchor is clicked', async () => {
			const story = fakeStory();

			story.storyFormat = 'Chapbook';
			renderComponent({stories: [story]});
			await screen.findByText('cover.png');
			fireEvent.click(
				screen.getByRole('button', {name: 'dialogs.storyAssets.insertAnchor'})
			);
			await waitFor(() =>
				expect(window.navigator.clipboard.writeText).toHaveBeenCalledWith(
					`{embed image: 'images/cover.png', alt: 'cover'}`
				)
			);
		});

		it('keeps the plain Insert and Insert as Anchor feedback states independent', async () => {
			renderComponent();
			await screen.findByText('cover.png');
			fireEvent.click(
				screen.getByRole('button', {name: 'dialogs.storyAssets.insert'})
			);
			await screen.findByRole('button', {name: 'dialogs.storyAssets.copied'});
			expect(
				screen.getByRole('button', {name: 'dialogs.storyAssets.insertAnchor'})
			).toBeInTheDocument();
		});
	});

	describe('with an existing sound asset', () => {
		beforeEach(() => {
			twineElectron.listStoryAssets.mockResolvedValue([
				{kind: 'sounds', name: 'theme.mp3', relativePath: 'sounds/theme.mp3'}
			]);
		});

		it('does not offer Insert as Anchor for a sound', async () => {
			renderComponent();
			await screen.findByText('theme.mp3');
			expect(
				screen.queryByRole('button', {
					name: 'dialogs.storyAssets.insertAnchor'
				})
			).not.toBeInTheDocument();
		});
	});

	describe('when a passage references a missing asset', () => {
		beforeEach(() => {
			twineElectron.listStoryAssets.mockResolvedValue([]);
		});

		it('shows a guidance message instead of blocking anything', async () => {
			const story = fakeStory();

			story.passages = [
				{
					...story.passages[0],
					name: 'Mock Passage',
					text: '<img src="images/missing.png">'
				}
			];
			renderComponent({stories: [story]});
			expect(
				await screen.findByText('dialogs.storyAssets.issuesTitle')
			).toBeInTheDocument();
			expect(
				screen.getByText('dialogs.storyAssets.issueMissing')
			).toBeInTheDocument();
			// Guidance only--the import button must still be usable, nothing
			// should be disabled or blocked by the issue.
			expect(
				screen.getByRole('button', {name: 'dialogs.storyAssets.importImage'})
			).toBeEnabled();
		});
	});

	it('is accessible', async () => {
		const {container} = renderComponent();

		await screen.findByText('dialogs.storyAssets.noImages');
		expect(await axe(container)).toHaveNoViolations();
	});
});
