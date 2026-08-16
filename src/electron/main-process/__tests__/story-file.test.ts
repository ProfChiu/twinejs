import {app, dialog, shell} from 'electron';
import {
	mkdirp,
	mkdtemp,
	move,
	readdir,
	readFile,
	rename,
	stat,
	writeFile
} from 'fs-extra';
import {
	deleteStory,
	loadStories,
	migrateStoriesToFolders,
	renameStory,
	saveStoryHtml
} from '../story-file';
import {getAppPref, setAppPref} from '../app-prefs';
import {
	fileWasTouched,
	stopTrackingFile,
	wasFileChangedExternally
} from '../track-file-changes';
import {fakeStory} from '../../../test-util';
import {Story} from '../../../store/stories';
import {storyFileName} from '../../shared/story-filename';

jest.mock('../app-prefs');
jest.mock('../story-directory', () => ({
	getStoryDirectoryPath: () => 'mock-story-directory'
}));
jest.mock('../track-file-changes');

// See https://github.com/facebook/jest/issues/2157
// This won't work in every case, so not putting it in test-utils.

function resolveAllPromises() {
	return new Promise(resolve => process.nextTick(resolve));
}

describe('deleteStory', () => {
	const stopTrackingFileMock = stopTrackingFile as jest.Mock;
	const trashItemMock = shell.trashItem as jest.Mock;
	let story: Story;
	let folderPath: string;

	beforeEach(() => {
		jest.spyOn(console, 'log').mockReturnValue();
		jest.spyOn(console, 'warn').mockReturnValue();
		story = fakeStory();
		folderPath = `mock-story-directory/${storyFileName(story, '')}`;
	});

	it("moves the story's whole folder to the trash", async () => {
		await deleteStory(story);
		expect(trashItemMock.mock.calls).toEqual([[folderPath]]);
	});

	it('stops tracking the file for changes', async () => {
		await deleteStory(story);
		expect(stopTrackingFileMock.mock.calls).toEqual([
			[`${folderPath}/${storyFileName(story)}`]
		]);
	});

	it('rejects with an error if trashing the item fails', async () => {
		const mockError = new Error();

		trashItemMock.mockRejectedValue(mockError);
		await expect(deleteStory(story)).rejects.toBe(mockError);
	});

	it('does not resolve until all async file operations have completed', async () => {
		let resolveTrashItem = () => {};
		const done = jest.fn();

		trashItemMock.mockReturnValue(
			new Promise<void>(resolve => (resolveTrashItem = resolve))
		);

		deleteStory(story).then(done);
		await resolveAllPromises();
		expect(done).not.toBeCalled();
		resolveTrashItem();
		await resolveAllPromises();
		expect(done).toBeCalledTimes(1);
	});
});

describe('loadStories', () => {
	const fileWasTouchedMock = fileWasTouched as jest.Mock;
	const readdirMock = readdir as jest.Mock;
	const readFileMock = readFile as jest.Mock;
	const statMock = stat as jest.Mock;

	beforeEach(() => {
		readdirMock.mockImplementation((path: string) => {
			switch (path) {
				case 'mock-story-directory':
					return Promise.resolve([
						{name: 'test-story-1', isDirectory: () => true},
						{name: 'test-story-2', isDirectory: () => true}
					]);

				case 'mock-story-directory/test-story-1':
					return Promise.resolve(['test-story-1.html']);

				case 'mock-story-directory/test-story-2':
					return Promise.resolve(['test-story-2.html']);

				default:
					throw new Error(`Asked to read a non-mocked directory: ${path}`);
			}
		});
		readFileMock.mockImplementation((name: string) => {
			switch (name) {
				case 'mock-story-directory/test-story-1/test-story-1.html':
					return Promise.resolve('mock story 1 contents');

				case 'mock-story-directory/test-story-2/test-story-2.html':
					return Promise.resolve('mock story 2 contents');

				default:
					throw new Error(`Asked to read a non-mocked file: ${name}`);
			}
		});
		statMock.mockImplementation((name: string) => {
			switch (name) {
				case 'mock-story-directory/test-story-1/test-story-1.html':
					return Promise.resolve({
						isDirectory: () => false,
						mtime: new Date('1/1/1990')
					});

				case 'mock-story-directory/test-story-2/test-story-2.html':
					return Promise.resolve({
						isDirectory: () => false,
						mtime: new Date('1/1/2000')
					});

				default:
					throw new Error(`Asked to stat a non-mocked file: ${name}`);
			}
		});
	});

	it('resolves to an array of stories, one per story folder', async () => {
		const result = await loadStories();

		expect(result).toEqual([
			{
				htmlSource: 'mock story 1 contents',
				mtime: expect.any(Date)
			},
			{
				htmlSource: 'mock story 2 contents',
				mtime: expect.any(Date)
			}
		]);
		expect(result[0].mtime.getTime()).toBe(new Date('1/1/1990').getTime());
		expect(result[1].mtime.getTime()).toBe(new Date('1/1/2000').getTime());
	});

	it('ignores top-level entries in the story directory that are files, not folders', async () => {
		readdirMock.mockImplementation((path: string) => {
			switch (path) {
				case 'mock-story-directory':
					return Promise.resolve([
						{name: 'test-story-1', isDirectory: () => true},
						{name: 'stray.html', isDirectory: () => false}
					]);

				case 'mock-story-directory/test-story-1':
					return Promise.resolve(['test-story-1.html']);

				default:
					throw new Error(`Asked to read a non-mocked directory: ${path}`);
			}
		});

		expect(await loadStories()).toEqual([
			{
				htmlSource: 'mock story 1 contents',
				mtime: expect.any(Date)
			}
		]);
	});

	it("ignores files inside a story folder that don't have a .html suffix", async () => {
		readdirMock.mockImplementation((path: string) => {
			switch (path) {
				case 'mock-story-directory':
					return Promise.resolve([
						{name: 'test-story-1', isDirectory: () => true}
					]);

				case 'mock-story-directory/test-story-1':
					return Promise.resolve(['test-story-1.html', 'notes.txt']);

				default:
					throw new Error(`Asked to read a non-mocked directory: ${path}`);
			}
		});

		expect(await loadStories()).toEqual([
			{
				htmlSource: 'mock story 1 contents',
				mtime: expect.any(Date)
			}
		]);
	});

	it('ignores the generated preview file inside a story folder', async () => {
		readdirMock.mockImplementation((path: string) => {
			switch (path) {
				case 'mock-story-directory':
					return Promise.resolve([
						{name: 'test-story-1', isDirectory: () => true}
					]);

				case 'mock-story-directory/test-story-1':
					return Promise.resolve(['test-story-1.html', '_preview.html']);

				default:
					throw new Error(`Asked to read a non-mocked directory: ${path}`);
			}
		});

		expect(await loadStories()).toEqual([
			{
				htmlSource: 'mock story 1 contents',
				mtime: expect.any(Date)
			}
		]);
	});

	it('begins tracking all story files', async () => {
		await loadStories();
		expect(fileWasTouchedMock.mock.calls).toEqual([
			['mock-story-directory/test-story-1/test-story-1.html'],
			['mock-story-directory/test-story-2/test-story-2.html']
		]);
	});

	it('rejects if loading any file fails', async () => {
		const mockError = new Error();

		readFileMock.mockImplementation((name: string) => {
			switch (name) {
				case 'mock-story-directory/test-story-1/test-story-1.html':
					return Promise.resolve('mock story 1 contents');

				case 'mock-story-directory/test-story-2/test-story-2.html':
					return Promise.reject(mockError);

				default:
					throw new Error(`Asked to read a non-mocked file: ${name}`);
			}
		});

		await expect(loadStories()).rejects.toBe(mockError);
	});

	it('does not resolve until all async file operations have finished', async () => {
		let resolveRootReaddir = () => {};
		let resolveFolderReaddir = () => {};
		let resolveStat = () => {};
		let resolveFileWasTouched = () => {};
		const done = jest.fn();

		readdirMock.mockImplementation((path: string) => {
			switch (path) {
				case 'mock-story-directory':
					return new Promise(resolve => {
						resolveRootReaddir = () =>
							resolve([{name: 'test-story-1', isDirectory: () => true}]);
					});

				case 'mock-story-directory/test-story-1':
					return new Promise(resolve => {
						resolveFolderReaddir = () => resolve(['test-story-1.html']);
					});

				default:
					throw new Error(`Asked to read a non-mocked directory: ${path}`);
			}
		});
		readFileMock.mockResolvedValue('mock story 1 contents');
		statMock.mockReturnValue(
			new Promise<any>(resolve => {
				resolveStat = () =>
					resolve({isDirectory: () => false, mtime: new Date('1/1/2000')});
			})
		);
		fileWasTouchedMock.mockReturnValue(
			new Promise<void>(resolve => (resolveFileWasTouched = resolve))
		);

		loadStories().then(done);
		await resolveAllPromises();
		expect(done).not.toBeCalled();
		resolveRootReaddir();
		await resolveAllPromises();
		expect(done).not.toBeCalled();
		resolveFolderReaddir();
		await resolveAllPromises();
		expect(done).not.toBeCalled();
		resolveStat();
		await resolveAllPromises();
		expect(done).not.toBeCalled();
		resolveFileWasTouched();
		await resolveAllPromises();
		expect(done).toBeCalledTimes(1);
	});
});

describe('renameStory', () => {
	let oldFolderPath: string;
	let newFolderPath: string;
	let oldFileNameInNewFolder: string;
	let newFilePath: string;
	let oldStory: Story;
	let newStory: Story;
	const fileWasTouchedMock = fileWasTouched as jest.Mock;
	const stopTrackingFileMock = stopTrackingFile as jest.Mock;
	const renameMock = rename as jest.Mock;

	beforeEach(() => {
		jest.spyOn(console, 'log').mockReturnValue();
		jest.spyOn(console, 'warn').mockReturnValue();
		oldStory = fakeStory();
		newStory = {...oldStory, name: 'mock-new-name'};
		oldFolderPath = `mock-story-directory/${storyFileName(oldStory, '')}`;
		newFolderPath = `mock-story-directory/${storyFileName(newStory, '')}`;
		oldFileNameInNewFolder = `${newFolderPath}/${storyFileName(oldStory)}`;
		newFilePath = `${newFolderPath}/${storyFileName(newStory)}`;
	});

	it('renames the story folder, then the story file inside it', async () => {
		await renameStory(oldStory, newStory);
		expect(renameMock.mock.calls).toEqual([
			[oldFolderPath, newFolderPath],
			[oldFileNameInNewFolder, newFilePath]
		]);
	});

	it('stops tracking the old filename', async () => {
		await renameStory(oldStory, newStory);
		expect(stopTrackingFileMock.mock.calls).toEqual([
			[`${oldFolderPath}/${storyFileName(oldStory)}`]
		]);
	});

	it('tracks the new filename', async () => {
		await renameStory(oldStory, newStory);
		expect(fileWasTouchedMock.mock.calls).toEqual([[newFilePath]]);
	});

	it('rejects if renaming the folder fails', async () => {
		const mockError = new Error();

		renameMock.mockRejectedValueOnce(mockError);
		await expect(renameStory(oldStory, newStory)).rejects.toBe(mockError);
	});

	it('rejects if renaming the file inside the folder fails', async () => {
		const mockError = new Error();

		renameMock
			.mockResolvedValueOnce(undefined)
			.mockRejectedValueOnce(mockError);
		await expect(renameStory(oldStory, newStory)).rejects.toBe(mockError);
	});

	it('does not resolve until all async file operations have finished', async () => {
		let resolveFolderRename = () => {};
		let resolveFileRename = () => {};
		let resolveFileWasTouched = () => {};
		const done = jest.fn();

		renameMock
			.mockImplementationOnce(
				() => new Promise<void>(resolve => (resolveFolderRename = resolve))
			)
			.mockImplementationOnce(
				() => new Promise<void>(resolve => (resolveFileRename = resolve))
			);
		fileWasTouchedMock.mockReturnValue(
			new Promise<void>(resolve => (resolveFileWasTouched = resolve))
		);

		renameStory(oldStory, newStory).then(done);
		await resolveAllPromises();
		expect(done).not.toBeCalled();
		resolveFolderRename();
		await resolveAllPromises();
		expect(done).not.toBeCalled();
		resolveFileRename();
		await resolveAllPromises();
		expect(done).not.toBeCalled();
		resolveFileWasTouched();
		await resolveAllPromises();
		expect(done).toBeCalledTimes(1);
	});
});

describe('saveStoryHtml()', () => {
	const fileWasTouchedMock = fileWasTouched as jest.Mock;
	const mkdirpMock = mkdirp as jest.Mock;
	const mkdtempMock = mkdtemp as jest.Mock;
	const moveMock = move as jest.Mock;
	const quitMock = app.quit as jest.Mock;
	const relaunchMock = app.relaunch as jest.Mock;
	const showMessageBoxMock = dialog.showMessageBox as jest.Mock;
	const wasFileChangedExternallyMock = wasFileChangedExternally as jest.Mock;
	const writeFileMock = writeFile as jest.Mock;
	let story: Story;
	let folderPath: string;

	beforeEach(() => {
		jest.spyOn(console, 'log').mockReturnValue();
		jest.spyOn(console, 'error').mockReturnValue();
		mkdtempMock.mockImplementation(
			async (prefix: string) => `mkdtemp-mock-${prefix}`
		);
		story = fakeStory();
		folderPath = `mock-story-directory/${storyFileName(story, '')}`;
	});

	it("ensures the story's folder and images/sounds subfolders exist", async () => {
		await saveStoryHtml(story, 'story html');
		expect(mkdirpMock.mock.calls).toEqual([
			[folderPath],
			[`${folderPath}/images`],
			[`${folderPath}/sounds`]
		]);
	});

	it('saves the HTML to a temp file, then replaces the destination with the temp file', async () => {
		await saveStoryHtml(story, 'story html');
		expect(writeFileMock.mock.calls).toEqual([
			[
				`mkdtemp-mock-mock-electron-app-path-temp/twine-${
					story.id
				}/${storyFileName(story)}`,
				'story html',
				'utf8'
			]
		]);
		expect(moveMock.mock.calls).toEqual([
			[
				`mkdtemp-mock-mock-electron-app-path-temp/twine-${
					story.id
				}/${storyFileName(story)}`,
				`${folderPath}/${storyFileName(story)}`,
				{overwrite: true}
			]
		]);
	});

	it('tracks that the destination file has changed', async () => {
		await saveStoryHtml(story, 'story html');
		expect(fileWasTouchedMock.mock.calls).toEqual([
			[`${folderPath}/${storyFileName(story)}`]
		]);
	});

	it('does not resolve until all async file operations have finished', async () => {
		let resolveMkdtemp = () => {};
		let resolveWriteFile = () => {};
		let resolveMove = () => {};
		let resolveFileWasTouched = () => {};
		const done = jest.fn();

		mkdtempMock.mockReturnValue(
			new Promise(resolve => (resolveMkdtemp = () => resolve('mock-temp-dir')))
		);
		writeFileMock.mockReturnValue(
			new Promise<void>(resolve => (resolveWriteFile = resolve))
		);
		moveMock.mockReturnValue(
			new Promise<void>(resolve => (resolveMove = resolve))
		);
		fileWasTouchedMock.mockReturnValue(
			new Promise<void>(resolve => (resolveFileWasTouched = resolve))
		);

		saveStoryHtml(story, 'story html').then(done);
		await resolveAllPromises();
		expect(done).not.toBeCalled();
		resolveMkdtemp();
		await resolveAllPromises();
		expect(done).not.toBeCalled();
		resolveWriteFile();
		await resolveAllPromises();
		expect(done).not.toBeCalled();
		resolveMove();
		await resolveAllPromises();
		expect(done).not.toBeCalled();
		resolveFileWasTouched();
		await resolveAllPromises();
		expect(done).toBeCalledTimes(1);
	});

	it("doesn't show a dialog", async () => {
		await saveStoryHtml(story, 'story html');
		expect(showMessageBoxMock).not.toHaveBeenCalled();
	});

	it('rejects if saving the HTML fails', async () => {
		const mockError = new Error();

		writeFileMock.mockRejectedValue(mockError);
		await expect(saveStoryHtml(story, 'story html')).rejects.toBe(mockError);
		expect(moveMock).not.toBeCalled();
	});

	it('rejects if replacing the destination file fails', async () => {
		const mockError = new Error();

		moveMock.mockRejectedValue(mockError);
		await expect(saveStoryHtml(story, 'story html')).rejects.toBe(mockError);
	});

	describe('if the destination file has been changed externally', () => {
		beforeEach(() => {
			wasFileChangedExternallyMock.mockResolvedValue(true);
			showMessageBoxMock.mockResolvedValue({response: 0});
		});

		it('asks the user what to do', async () => {
			await saveStoryHtml(story, 'story html');
			expect(showMessageBoxMock).toHaveBeenCalled();
		});

		it('relaunches if the user chooses that option', async () => {
			showMessageBoxMock.mockResolvedValue({response: 1});
			await saveStoryHtml(story, 'story html');
			expect(relaunchMock).toHaveBeenCalled();
			expect(quitMock).toHaveBeenCalled();
			expect(writeFileMock).not.toHaveBeenCalled();
		});

		it('overwrites the destination if the user chooses that option', async () => {
			showMessageBoxMock.mockResolvedValue({response: 0});
			await saveStoryHtml(story, 'story html');
			expect(relaunchMock).not.toHaveBeenCalled();
			expect(quitMock).not.toHaveBeenCalled();
			expect(writeFileMock).toHaveBeenCalled();
		});
	});
});

describe('migrateStoriesToFolders', () => {
	const getAppPrefMock = getAppPref as jest.Mock;
	const setAppPrefMock = setAppPref as jest.Mock;
	const mkdirpMock = mkdirp as jest.Mock;
	const moveMock = move as jest.Mock;
	const readdirMock = readdir as jest.Mock;

	beforeEach(() => {
		jest.spyOn(console, 'log').mockReturnValue();
		jest.spyOn(console, 'warn').mockReturnValue();
		getAppPrefMock.mockReturnValue(undefined);
		moveMock.mockResolvedValue(undefined);
	});

	it('does nothing if stories were already migrated', async () => {
		getAppPrefMock.mockReturnValue(true);
		await migrateStoriesToFolders();
		expect(readdirMock).not.toBeCalled();
	});

	it('moves flat .html files into a matching subfolder with images/sounds subfolders', async () => {
		readdirMock.mockResolvedValue([
			{name: 'story-a.html', isFile: () => true, isDirectory: () => false},
			{name: 'story-b.html', isFile: () => true, isDirectory: () => false}
		]);

		await migrateStoriesToFolders();
		expect(mkdirpMock.mock.calls).toEqual([
			['mock-story-directory/story-a/images'],
			['mock-story-directory/story-a/sounds'],
			['mock-story-directory/story-b/images'],
			['mock-story-directory/story-b/sounds']
		]);
		expect(moveMock.mock.calls).toEqual([
			[
				'mock-story-directory/story-a.html',
				'mock-story-directory/story-a/story-a.html'
			],
			[
				'mock-story-directory/story-b.html',
				'mock-story-directory/story-b/story-b.html'
			]
		]);
	});

	it('ignores entries that are already directories', async () => {
		readdirMock.mockResolvedValue([
			{name: 'already-a-folder', isFile: () => false, isDirectory: () => true}
		]);

		await migrateStoriesToFolders();
		expect(moveMock).not.toBeCalled();
	});

	it('marks migration complete afterward', async () => {
		readdirMock.mockResolvedValue([]);
		await migrateStoriesToFolders();
		expect(setAppPrefMock).toHaveBeenCalledWith(
			'storiesMigratedToFolders',
			true
		);
	});

	it('continues migrating remaining files if one fails, and still marks migration complete', async () => {
		readdirMock.mockResolvedValue([
			{name: 'bad.html', isFile: () => true, isDirectory: () => false},
			{name: 'good.html', isFile: () => true, isDirectory: () => false}
		]);
		moveMock.mockImplementation((from: string) =>
			from === 'mock-story-directory/bad.html'
				? Promise.reject(new Error('mock failure'))
				: Promise.resolve()
		);

		await migrateStoriesToFolders();
		expect(moveMock).toHaveBeenCalledTimes(2);
		expect(setAppPrefMock).toHaveBeenCalledWith(
			'storiesMigratedToFolders',
			true
		);
	});
});
