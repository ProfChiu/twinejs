import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import * as React from 'react';
import {useAddPassageImage} from '../use-add-passage-image';
import {isElectronRenderer} from '../../../util/is-electron';
import {
	FakeStateProvider,
	StoryInspector,
	fakePassage,
	fakeStory
} from '../../../test-util';
import {Story} from '../../../store/stories';

jest.mock('../../../util/is-electron');

const TestComponent: React.FC<{
	story: Story;
	editor?: {replaceSelection: jest.Mock; focus: jest.Mock};
}> = ({story, editor}) => {
	const {addImage, available} = useAddPassageImage(story);

	return (
		<div>
			<span data-testid="available">{String(available)}</span>
			<button onClick={() => addImage(story.passages[0], 'anchor')}>
				add-anchor
			</button>
			<button onClick={() => addImage(story.passages[0], 'float-left')}>
				add-float-left
			</button>
			<button
				onClick={() =>
					addImage(story.passages[0], 'anchor', editor as any)
				}
			>
				add-anchor-with-editor
			</button>
		</div>
	);
};

describe('useAddPassageImage', () => {
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

	function renderWithStory(
		story: Story,
		editor?: {replaceSelection: jest.Mock; focus: jest.Mock}
	) {
		return render(
			<FakeStateProvider stories={[story]}>
				<TestComponent editor={editor} story={story} />
				<StoryInspector />
			</FakeStateProvider>
		);
	}

	describe('outside an Electron context', () => {
		beforeEach(() => isElectronRendererMock.mockReturnValue(false));

		it('reports unavailable', () => {
			const story = fakeStory();

			renderWithStory(story);
			expect(screen.getByTestId('available')).toHaveTextContent('false');
		});

		it('does nothing when called', async () => {
			const story = fakeStory();
			const passage = story.passages[0];
			const originalText = passage.text;

			renderWithStory(story);
			fireEvent.click(screen.getByText('add-anchor'));
			await waitFor(() =>
				expect(
					screen.getByTestId(`passage-${passage.id}`)
				).toHaveTextContent(originalText || '')
			);
		});
	});

	describe('in an Electron context', () => {
		beforeEach(() => {
			isElectronRendererMock.mockReturnValue(true);
			(window as any).twineElectron = twineElectron;
		});

		it('reports available', () => {
			renderWithStory(fakeStory());
			expect(screen.getByTestId('available')).toHaveTextContent('true');
		});

		it('appends the aligned snippet to the passage text', async () => {
			const story = fakeStory();
			const passage = fakePassage({text: 'Once upon a time...'});

			story.passages = [passage];
			renderWithStory(story);
			fireEvent.click(screen.getByText('add-anchor'));
			await waitFor(() =>
				expect(twineElectron.importStoryAsset).toHaveBeenCalledWith(
					story,
					'images'
				)
			);
			const text = screen.getByTestId(`passage-${passage.id}`).textContent;

			expect(text).toContain('Once upon a time...');
			expect(text).toContain('<img class="scene" src="images/cover.png">');
		});

		it('appends one snippet per file when multiple images are chosen at once', async () => {
			twineElectron.importStoryAsset.mockResolvedValue([
				{
					kind: 'images',
					name: 'a.png',
					relativePath: 'images/a.png',
					absolutePath: '/mock/images/a.png'
				},
				{
					kind: 'images',
					name: 'b.png',
					relativePath: 'images/b.png',
					absolutePath: '/mock/images/b.png'
				}
			]);

			const story = fakeStory();
			const passage = fakePassage({text: ''});

			story.passages = [passage];
			renderWithStory(story);
			fireEvent.click(screen.getByText('add-float-left'));
			await waitFor(() => {
				const text = screen.getByTestId(`passage-${passage.id}`).textContent;

				expect(text).toContain('images/a.png');
				expect(text).toContain('images/b.png');
			});
		});

		it('does not change the passage if the file picker is canceled', async () => {
			twineElectron.importStoryAsset.mockResolvedValue([]);

			const story = fakeStory();
			const passage = fakePassage({text: 'Unchanged.'});

			story.passages = [passage];
			renderWithStory(story);
			fireEvent.click(screen.getByText('add-anchor'));
			await waitFor(() =>
				expect(twineElectron.importStoryAsset).toHaveBeenCalled()
			);
			expect(
				screen.getByTestId(`passage-${passage.id}`)
			).toHaveTextContent('Unchanged.');
		});

		describe('when a live editor is passed', () => {
			function fakeEditor() {
				return {replaceSelection: jest.fn(), focus: jest.fn()};
			}

			it('inserts at the cursor via replaceSelection instead of dispatching directly', async () => {
				const story = fakeStory();
				const passage = fakePassage({text: 'Unchanged in Redux.'});
				const editor = fakeEditor();

				story.passages = [passage];
				renderWithStory(story, editor);
				fireEvent.click(screen.getByText('add-anchor-with-editor'));
				await waitFor(() =>
					expect(editor.replaceSelection).toHaveBeenCalledWith(
						'<img class="scene" src="images/cover.png">\n'
					)
				);
				// The hook itself must not also dispatch a text update in this
				// path--CodeArea's own onBeforeChange wiring is what's responsible
				// for that once replaceSelection fires a real 'change' event, which
				// this fake editor doesn't do. Seeing the original Redux text
				// unchanged here confirms the hook didn't double-update.
				expect(
					screen.getByTestId(`passage-${passage.id}`)
				).toHaveTextContent('Unchanged in Redux.');
			});

			it('focuses the editor after inserting', async () => {
				const story = fakeStory();
				const editor = fakeEditor();

				renderWithStory(story, editor);
				fireEvent.click(screen.getByText('add-anchor-with-editor'));
				await waitFor(() => expect(editor.focus).toHaveBeenCalled());
			});

			it('does not call replaceSelection if the file picker is canceled', async () => {
				twineElectron.importStoryAsset.mockResolvedValue([]);

				const story = fakeStory();
				const editor = fakeEditor();

				renderWithStory(story, editor);
				fireEvent.click(screen.getByText('add-anchor-with-editor'));
				await waitFor(() =>
					expect(twineElectron.importStoryAsset).toHaveBeenCalled()
				);
				expect(editor.replaceSelection).not.toHaveBeenCalled();
			});
		});
	});
});
