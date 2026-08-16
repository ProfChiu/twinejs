import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import * as React from 'react';
import {useLayoutTokens} from '../use-layout-tokens';
import {isElectronRenderer} from '../../../util/is-electron';
import {
	FakeStateProvider,
	StoryInspector,
	fakePassage,
	fakeStory
} from '../../../test-util';
import {Story} from '../../../store/stories';
import {LayoutTokens} from '../layout-tokens';

jest.mock('../../../util/is-electron');

const TestComponent: React.FC<{story: Story}> = ({story}) => {
	const {loading, tokens, updateTokens} = useLayoutTokens(story);

	return (
		<div>
			<span data-testid="loading">{String(loading)}</span>
			<span data-testid="tokens">{JSON.stringify(tokens)}</span>
			<button onClick={() => updateTokens({backgroundColor: '#123123'})}>
				update-bg
			</button>
			<button
				onClick={() =>
					updateTokens({preset: 'centered-book', backgroundColor: '#f8f5ef'})
				}
			>
				update-preset
			</button>
		</div>
	);
};

describe('useLayoutTokens', () => {
	const isElectronRendererMock = isElectronRenderer as jest.Mock;
	let twineElectron: {
		loadStorySidecar: jest.Mock;
		saveStorySidecar: jest.Mock;
	};

	beforeEach(() => {
		isElectronRendererMock.mockReturnValue(true);
		twineElectron = {
			loadStorySidecar: jest.fn().mockResolvedValue({}),
			saveStorySidecar: jest.fn().mockResolvedValue(undefined)
		};
		(window as any).twineElectron = twineElectron;
	});

	afterEach(() => {
		delete (window as any).twineElectron;
	});

	function renderWithStory(story: Story) {
		return render(
			<FakeStateProvider stories={[story]}>
				<TestComponent story={story} />
				<StoryInspector />
			</FakeStateProvider>
		);
	}

	it('loads saved tokens from the sidecar', async () => {
		const savedTokens: Partial<LayoutTokens> = {
			preset: 'sidebar',
			backgroundColor: '#ffffff'
		};

		twineElectron.loadStorySidecar.mockResolvedValue({layout: savedTokens});

		const story = fakeStory();

		renderWithStory(story);
		expect(twineElectron.loadStorySidecar).toHaveBeenCalledWith(story);
		await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
		expect(screen.getByTestId('tokens')).toHaveTextContent('"preset":"sidebar"');
	});

	it('backfills tokens absent from an older sidecar with defaults (no undefined fields)', async () => {
		// A layout saved before passageBackgrounds/leftGap existed. Merging over
		// defaults must give them values so the designer doesn't crash on
		// passageBackgrounds.map(...).
		const olderSaved: Partial<LayoutTokens> = {
			preset: 'character-panel',
			leftPanelWidth: 280,
			alignLeft: false
		};

		twineElectron.loadStorySidecar.mockResolvedValue({layout: olderSaved});

		const story = fakeStory();

		renderWithStory(story);
		await waitFor(() =>
			expect(screen.getByTestId('loading')).toHaveTextContent('false')
		);
		const tokens = screen.getByTestId('tokens');

		expect(tokens).toHaveTextContent('"preset":"character-panel"');
		expect(tokens).toHaveTextContent('"passageBackgrounds":[]');
		expect(tokens).toHaveTextContent('"leftGap":0');
	});

	it('falls back to defaults when the sidecar has no saved layout', async () => {
		const story = fakeStory();

		renderWithStory(story);
		await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
		expect(screen.getByTestId('tokens')).toHaveTextContent('"preset":"visual-novel"');
	});

	describe('for a Harlowe story', () => {
		it('applies generated CSS to the Story Stylesheet on updateTokens', async () => {
			const story = fakeStory();

			story.storyFormat = 'Harlowe';
			story.stylesheet = '';
			renderWithStory(story);
			await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
			fireEvent.click(screen.getByText('update-bg'));
			expect(
				screen.getByTestId('story-inspector-stylesheet-default')
			).toHaveTextContent('#123123');
		});

		it('preserves hand-written stylesheet content', async () => {
			const story = fakeStory();

			story.storyFormat = 'Harlowe';
			story.stylesheet = 'tw-passage.custom { color: red; }';
			renderWithStory(story);
			await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
			fireEvent.click(screen.getByText('update-bg'));
			expect(
				screen.getByTestId('story-inspector-stylesheet-default')
			).toHaveTextContent('color: red');
		});

		it('persists the new tokens to the sidecar', async () => {
			const story = fakeStory();

			story.storyFormat = 'Harlowe';
			renderWithStory(story);
			await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
			fireEvent.click(screen.getByText('update-bg'));
			expect(twineElectron.saveStorySidecar).toHaveBeenCalledWith(
				story,
				expect.objectContaining({
					layout: expect.objectContaining({backgroundColor: '#123123'})
				})
			);
		});
	});

	describe('for a Chapbook story', () => {
		it("applies generated config lines to the start passage's vars section", async () => {
			const passage = fakePassage({text: 'Once upon a time...'});
			const story = fakeStory();

			story.storyFormat = 'Chapbook';
			story.passages = [passage];
			story.startPassage = passage.id;
			renderWithStory(story);
			await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
			fireEvent.click(screen.getByText('update-bg'));

			const passageText = screen.getByTestId(`passage-${passage.id}`).textContent;

			expect(passageText).toContain(`config.style.backdrop: '#123123'`);
			expect(passageText).toContain('Once upon a time...');
			expect(passageText).toContain('--');
		});

		it('does not touch the Story Stylesheet', async () => {
			const passage = fakePassage({text: 'Once upon a time...'});
			const story = fakeStory();

			story.storyFormat = 'Chapbook';
			story.passages = [passage];
			story.startPassage = passage.id;
			story.stylesheet = 'untouched stylesheet';
			renderWithStory(story);
			await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
			fireEvent.click(screen.getByText('update-bg'));
			expect(
				screen.getByTestId('story-inspector-stylesheet-default')
			).toHaveTextContent('untouched stylesheet');
		});

		it('preserves hand-written vars and story text across repeated updates', async () => {
			const passage = fakePassage({
				text: `gold: 0\n--\nOnce upon a time...`
			});
			const story = fakeStory();

			story.storyFormat = 'Chapbook';
			story.passages = [passage];
			story.startPassage = passage.id;
			renderWithStory(story);
			await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
			fireEvent.click(screen.getByText('update-bg'));
			fireEvent.click(screen.getByText('update-preset'));

			const passageText = screen.getByTestId(`passage-${passage.id}`).textContent;

			expect(passageText).toContain('gold: 0');
			expect(passageText).toContain('Once upon a time...');
			expect(passageText).toContain(`config.style.backdrop: '#f8f5ef'`);
		});
	});

	describe('outside an Electron context', () => {
		beforeEach(() => {
			isElectronRendererMock.mockReturnValue(false);
			delete (window as any).twineElectron;
		});

		it('is not loading and uses default tokens', async () => {
			const story = fakeStory();

			renderWithStory(story);
			await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
			expect(screen.getByTestId('tokens')).toHaveTextContent('"preset":"visual-novel"');
		});
	});
});
