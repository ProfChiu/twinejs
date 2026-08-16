import {act, renderHook} from '@testing-library/react-hooks';
import {useStoryAssets} from '../use-story-assets';
import {isElectronRenderer} from '../../../util/is-electron';
import {fakeStory} from '../../../test-util';
import {Story} from '../../../store/stories';
import {StoryAsset} from '../../../electron/main-process/story-assets.types';

jest.mock('../../../util/is-electron');

describe('useStoryAssets', () => {
	const isElectronRendererMock = isElectronRenderer as jest.Mock;
	let story: Story;
	let twineElectron: {
		deleteStoryAsset: jest.Mock;
		importStoryAsset: jest.Mock;
		listStoryAssets: jest.Mock;
		revealStoryAsset: jest.Mock;
	};
	const fakeAssets: StoryAsset[] = [
		{
			kind: 'images',
			name: 'cover.png',
			relativePath: 'images/cover.png',
			absolutePath: '/mock/story-folder/images/cover.png'
		}
	];

	beforeEach(() => {
		story = fakeStory();
		twineElectron = {
			deleteStoryAsset: jest.fn().mockResolvedValue(undefined),
			importStoryAsset: jest.fn().mockResolvedValue([]),
			listStoryAssets: jest.fn().mockResolvedValue(fakeAssets),
			revealStoryAsset: jest.fn().mockResolvedValue(undefined)
		};
	});

	describe('outside an Electron context', () => {
		beforeEach(() => {
			isElectronRendererMock.mockReturnValue(false);
			delete (window as any).twineElectron;
		});

		it('never lists assets and stays loading', async () => {
			const {result} = renderHook(() => useStoryAssets(story));

			expect(result.current.assets).toEqual([]);
			await result.current.importAsset('images');
			await result.current.deleteAsset(fakeAssets[0]);
			await result.current.revealAsset(fakeAssets[0]);
			// Nothing to assert on calls since there's no twineElectron global at
			// all in this context--the point is none of the above throw.
		});
	});

	describe('in an Electron context', () => {
		beforeEach(() => {
			isElectronRendererMock.mockReturnValue(true);
			(window as any).twineElectron = twineElectron;
		});

		it('lists the story assets on mount', async () => {
			const {result, waitForNextUpdate} = renderHook(() =>
				useStoryAssets(story)
			);

			expect(result.current.loading).toBe(true);
			await waitForNextUpdate();
			expect(twineElectron.listStoryAssets).toHaveBeenCalledWith(story);
			expect(result.current.assets).toEqual(fakeAssets);
			expect(result.current.loading).toBe(false);
			expect(result.current.error).toBeUndefined();
		});

		it('sets an error message if listing assets fails', async () => {
			twineElectron.listStoryAssets.mockRejectedValue(
				new Error('mock failure')
			);

			const {result, waitForNextUpdate} = renderHook(() =>
				useStoryAssets(story)
			);

			await waitForNextUpdate();
			expect(result.current.error).toBe('mock failure');
			expect(result.current.loading).toBe(false);
		});

		it('imports an asset, then refreshes the list', async () => {
			const {result, waitForNextUpdate} = renderHook(() =>
				useStoryAssets(story)
			);

			await waitForNextUpdate();
			twineElectron.listStoryAssets.mockClear();
			await act(async () => {
				await result.current.importAsset('sounds');
			});
			expect(twineElectron.importStoryAsset).toHaveBeenCalledWith(
				story,
				'sounds'
			);
			expect(twineElectron.listStoryAssets).toHaveBeenCalledTimes(1);
		});

		it('deletes an asset, then refreshes the list', async () => {
			const {result, waitForNextUpdate} = renderHook(() =>
				useStoryAssets(story)
			);

			await waitForNextUpdate();
			twineElectron.listStoryAssets.mockClear();
			await act(async () => {
				await result.current.deleteAsset(fakeAssets[0]);
			});
			expect(twineElectron.deleteStoryAsset).toHaveBeenCalledWith(
				story,
				'images',
				'cover.png'
			);
			expect(twineElectron.listStoryAssets).toHaveBeenCalledTimes(1);
		});

		it('reveals an asset without refreshing the list', async () => {
			const {result, waitForNextUpdate} = renderHook(() =>
				useStoryAssets(story)
			);

			await waitForNextUpdate();
			twineElectron.listStoryAssets.mockClear();
			await act(async () => {
				await result.current.revealAsset(fakeAssets[0]);
			});
			expect(twineElectron.revealStoryAsset).toHaveBeenCalledWith(
				story,
				'images',
				'cover.png'
			);
			expect(twineElectron.listStoryAssets).not.toHaveBeenCalled();
		});
	});
});
