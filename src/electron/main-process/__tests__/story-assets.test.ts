import {dialog, shell} from 'electron';
import {copy, readdir, remove} from 'fs-extra';
import {
	deleteStoryAsset,
	importStoryAsset,
	listStoryAssets,
	revealStoryAsset
} from '../story-assets';
import {ensureStoryAssetFolders} from '../story-file';
import {fakeStory} from '../../../test-util';
import {Story} from '../../../store/stories';

jest.mock('../story-file', () => ({
	ensureStoryAssetFolders: jest.fn(),
	getStoryFolderPath: (story: any) => `mock-story-folder-${story.id}`
}));

describe('listStoryAssets', () => {
	const readdirMock = readdir as jest.Mock;
	let story: Story;
	let folderPath: string;

	beforeEach(() => {
		story = fakeStory();
		folderPath = `mock-story-folder-${story.id}`;
	});

	it('combines files from the images and sounds subfolders', async () => {
		readdirMock.mockImplementation((path: string) => {
			switch (path) {
				case `${folderPath}/images`:
					return Promise.resolve([{name: 'cover.png', isFile: () => true}]);

				case `${folderPath}/sounds`:
					return Promise.resolve([{name: 'theme.mp3', isFile: () => true}]);

				default:
					throw new Error(`Asked to read a non-mocked directory: ${path}`);
			}
		});

		expect(await listStoryAssets(story)).toEqual([
			{
				kind: 'images',
				name: 'cover.png',
				relativePath: 'images/cover.png',
				absolutePath: `${folderPath}/images/cover.png`
			},
			{
				kind: 'sounds',
				name: 'theme.mp3',
				relativePath: 'sounds/theme.mp3',
				absolutePath: `${folderPath}/sounds/theme.mp3`
			}
		]);
	});

	it('ignores directories inside the images/sounds subfolders', async () => {
		readdirMock.mockImplementation((path: string) => {
			switch (path) {
				case `${folderPath}/images`:
					return Promise.resolve([
						{name: 'cover.png', isFile: () => true},
						{name: 'subfolder', isFile: () => false}
					]);

				case `${folderPath}/sounds`:
					return Promise.resolve([]);

				default:
					throw new Error(`Asked to read a non-mocked directory: ${path}`);
			}
		});

		expect(await listStoryAssets(story)).toEqual([
			{
				kind: 'images',
				name: 'cover.png',
				relativePath: 'images/cover.png',
				absolutePath: `${folderPath}/images/cover.png`
			}
		]);
	});

	it("resolves to an empty array for a subfolder that doesn't exist yet", async () => {
		readdirMock.mockRejectedValue(new Error('mock ENOENT'));
		expect(await listStoryAssets(story)).toEqual([]);
	});
});

describe('importStoryAsset', () => {
	const ensureStoryAssetFoldersMock = ensureStoryAssetFolders as jest.Mock;
	const copyMock = copy as jest.Mock;
	const showOpenDialogMock = dialog.showOpenDialog as jest.Mock;
	let story: Story;
	let folderPath: string;

	beforeEach(() => {
		story = fakeStory();
		folderPath = `mock-story-folder-${story.id}`;
		ensureStoryAssetFoldersMock.mockResolvedValue(folderPath);
	});

	it('resolves to an empty array if the user cancels the picker', async () => {
		showOpenDialogMock.mockResolvedValue({canceled: true, filePaths: []});
		expect(await importStoryAsset(story, 'images')).toEqual([]);
		expect(copyMock).not.toBeCalled();
	});

	it('copies each chosen file into the images subfolder and returns the imported assets', async () => {
		showOpenDialogMock.mockResolvedValue({
			canceled: false,
			filePaths: ['/mock/source/cover.png', '/mock/source/title.jpg']
		});

		expect(await importStoryAsset(story, 'images')).toEqual([
			{
				kind: 'images',
				name: 'cover.png',
				relativePath: 'images/cover.png',
				absolutePath: `${folderPath}/images/cover.png`
			},
			{
				kind: 'images',
				name: 'title.jpg',
				relativePath: 'images/title.jpg',
				absolutePath: `${folderPath}/images/title.jpg`
			}
		]);
		expect(copyMock.mock.calls).toEqual([
			[
				'/mock/source/cover.png',
				`${folderPath}/images/cover.png`,
				{overwrite: true}
			],
			[
				'/mock/source/title.jpg',
				`${folderPath}/images/title.jpg`,
				{overwrite: true}
			]
		]);
	});

	it('copies chosen files into the sounds subfolder when asked for sounds', async () => {
		showOpenDialogMock.mockResolvedValue({
			canceled: false,
			filePaths: ['/mock/source/theme.mp3']
		});

		expect(await importStoryAsset(story, 'sounds')).toEqual([
			{
				kind: 'sounds',
				name: 'theme.mp3',
				relativePath: 'sounds/theme.mp3',
				absolutePath: `${folderPath}/sounds/theme.mp3`
			}
		]);
	});

	it('ensures the story folder exists before copying', async () => {
		showOpenDialogMock.mockResolvedValue({
			canceled: false,
			filePaths: ['/mock/source/cover.png']
		});

		await importStoryAsset(story, 'images');
		expect(ensureStoryAssetFoldersMock).toHaveBeenCalledWith(story);
	});
});

describe('deleteStoryAsset', () => {
	const removeMock = remove as jest.Mock;

	it('removes the asset file', async () => {
		const story = fakeStory();

		await deleteStoryAsset(story, 'images', 'cover.png');
		expect(removeMock.mock.calls).toEqual([
			[`mock-story-folder-${story.id}/images/cover.png`]
		]);
	});

	it('rejects if removing the file fails', async () => {
		const mockError = new Error();

		removeMock.mockRejectedValue(mockError);
		await expect(
			deleteStoryAsset(fakeStory(), 'images', 'cover.png')
		).rejects.toBe(mockError);
	});
});

describe('revealStoryAsset', () => {
	const showItemInFolderMock = shell.showItemInFolder as jest.Mock;

	it('reveals the asset file in the system file browser', async () => {
		const story = fakeStory();

		await revealStoryAsset(story, 'sounds', 'theme.mp3');
		expect(showItemInFolderMock.mock.calls).toEqual([
			[`mock-story-folder-${story.id}/sounds/theme.mp3`]
		]);
	});
});
