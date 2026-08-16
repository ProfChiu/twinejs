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
import {basename, join} from 'path';
import {i18n} from './locales';
import {getAppPref, setAppPref} from './app-prefs';
import {getStoryDirectoryPath} from './story-directory';
import {Story} from '../../store/stories/stories.types';
import {storyFileName} from '../shared/story-filename';
import {
	stopTrackingFile,
	fileWasTouched,
	wasFileChangedExternally
} from './track-file-changes';

export interface StoryFile {
	htmlSource: string;
	mtime: Date;
}

/**
 * Filename used for a story's generated Play/Test/Proof preview. Written
 * inside the story's own folder (see getStoryFolderPath()) so that relative
 * image/sound paths resolve the same way they will once published. Excluded
 * from loadStories() so it's never mistaken for a story.
 */
export const PREVIEW_FILE_NAME = '_preview.html';

/**
 * Twine121 stores each story in its own folder (rather than upstream Twine's
 * single loose .html file) so that images/ and sounds/ subfolders can sit
 * next to it with working relative paths. Returns the sanitized folder name
 * for a story--this reuses storyFileName()'s sanitization with an empty
 * extension so folder and file names can never disagree.
 */
export function storyFolderName(story: Story) {
	return storyFileName(story, '');
}

/**
 * Returns the full path to a story's own folder.
 */
export function getStoryFolderPath(story: Story) {
	return join(getStoryDirectoryPath(), storyFolderName(story));
}

/**
 * Ensures a story's folder and its images/ and sounds/ subfolders exist.
 * Safe to call repeatedly--mkdirp() no-ops if they already exist.
 */
export async function ensureStoryAssetFolders(story: Story) {
	const folderPath = getStoryFolderPath(story);

	await mkdirp(folderPath);
	await mkdirp(join(folderPath, 'images'));
	await mkdirp(join(folderPath, 'sounds'));
	return folderPath;
}

/**
 * Returns a promise resolving to an array of HTML strings to load from the
 * story directory. Each story lives in its own subfolder of the story
 * directory; this looks one level into each subfolder for .html files
 * (ignoring the generated preview file).
 */
export async function loadStories() {
	const storyPath = getStoryDirectoryPath();
	const result: StoryFile[] = [];
	const entries = await readdir(storyPath, {withFileTypes: true});

	await Promise.all(
		entries
			.filter(entry => entry.isDirectory())
			.map(async folderEntry => {
				const folderPath = join(storyPath, folderEntry.name);
				const filesInFolder = await readdir(folderPath);

				await Promise.all(
					filesInFolder
						.filter(f => /\.html$/i.test(f) && f !== PREVIEW_FILE_NAME)
						.map(async f => {
							const filePath = join(folderPath, f);
							const stats = await stat(filePath);

							if (!stats.isDirectory()) {
								result.push({
									mtime: stats.mtime,
									htmlSource: await readFile(filePath, 'utf8')
								});
								return fileWasTouched(filePath);
							}
						})
				);
			})
	);

	return result;
}

/**
 * Saves story HTML to the file system. This returns a promise that resolves
 * when complete. Ensures the story's folder (and its images/sounds
 * subfolders) exist first, since this is the first point at which a
 * brand-new story is written to disk.
 */
export async function saveStoryHtml(story: Story, storyHtml: string) {
	// We save to a temp file first, then overwrite the existing if that succeeds,
	// so that if any step fails, the original file is left intact.

	const folderPath = await ensureStoryAssetFolders(story);
	const savedFilePath = join(folderPath, storyFileName(story));

	console.log(`Saving ${savedFilePath}`);

	try {
		const tempFileDirectory = await mkdtemp(
			join(app.getPath('temp'), `twine-${story.id}`)
		);
		const tempFilePath = join(tempFileDirectory, storyFileName(story));

		if (await wasFileChangedExternally(savedFilePath)) {
			const {response} = await dialog.showMessageBox({
				buttons: [
					i18n.t('electron.errors.storyFileChangedExternally.overwriteChoice'),
					i18n.t('electron.errors.storyFileChangedExternally.relaunchChoice')
				],
				detail: i18n.t('electron.errors.storyFileChangedExternally.detail'),
				message: i18n.t('electron.errors.storyFileChangedExternally.message', {
					fileName: basename(savedFilePath)
				}),
				type: 'warning'
			});

			if (response === 1) {
				app.relaunch();
				app.quit();
				return;
			}
		}

		await writeFile(tempFilePath, storyHtml, 'utf8');
		await move(tempFilePath, savedFilePath, {
			overwrite: true
		});
		await fileWasTouched(savedFilePath);
		console.log(`Successfully saved ${savedFilePath}`);
	} catch (e) {
		console.error(`Error while saving ${savedFilePath}: ${e}`);
		throw e;
	}
}

/**
 * Deletes a story by moving its entire folder (HTML, images, sounds, and
 * sidecar data) to the trash. This returns a promise that resolves when
 * finished.
 */
export async function deleteStory(story: Story) {
	try {
		const folderPath = getStoryFolderPath(story);

		console.log(`Trashing ${folderPath}`);
		await shell.trashItem(folderPath);
		stopTrackingFile(join(folderPath, storyFileName(story)));
		console.log(`Successfully trashed ${folderPath}`);
	} catch (e) {
		console.warn(`Error while deleting story: ${e}`);
		throw e;
	}
}

/**
 * Renames a story in the file system. Renames the story's whole folder (so
 * images/sounds/sidecar data move with it), then renames the HTML file
 * inside it to match. This returns a promise that resolves when finished.
 */
export async function renameStory(oldStory: Story, newStory: Story) {
	try {
		const oldFolderPath = getStoryFolderPath(oldStory);
		const newFolderPath = getStoryFolderPath(newStory);
		const oldFilePath = join(oldFolderPath, storyFileName(oldStory));

		console.log(`Renaming ${oldFolderPath} to ${newFolderPath}`);
		await rename(oldFolderPath, newFolderPath);

		const movedFilePath = join(newFolderPath, storyFileName(oldStory));
		const newFilePath = join(newFolderPath, storyFileName(newStory));

		await rename(movedFilePath, newFilePath);
		stopTrackingFile(oldFilePath);
		await fileWasTouched(newFilePath);
		console.log(`Successfully renamed ${oldFolderPath} to ${newFolderPath}`);
	} catch (e) {
		console.warn(`Error while renaming story: ${e}`);
		throw e;
	}
}

/**
 * One-time migration from pre-Twine121 Twine's flat story layout (loose
 * <name>.html files directly in the story directory) to Twine121's per-story
 * folder layout. Guarded by the storiesMigratedToFolders app pref so it only
 * ever does work once; safe to call on every startup. Callers should back up
 * the story directory (see backupStoryDirectory()) before calling this, so a
 * partial failure is always recoverable.
 */
export async function migrateStoriesToFolders() {
	if (getAppPref('storiesMigratedToFolders')) {
		return;
	}

	const storyPath = getStoryDirectoryPath();
	const entries = await readdir(storyPath, {withFileTypes: true});
	const flatHtmlFiles = entries.filter(
		entry => entry.isFile() && /\.html$/i.test(entry.name)
	);

	if (flatHtmlFiles.length > 0) {
		console.log(
			`Migrating ${flatHtmlFiles.length} story file(s) to per-story folders`
		);
	}

	for (const entry of flatHtmlFiles) {
		const oldFilePath = join(storyPath, entry.name);
		const folderName = entry.name.replace(/\.html$/i, '');
		const folderPath = join(storyPath, folderName);

		try {
			await mkdirp(join(folderPath, 'images'));
			await mkdirp(join(folderPath, 'sounds'));
			await move(oldFilePath, join(folderPath, entry.name));
			console.log(`Migrated ${entry.name} to ${folderPath}`);
		} catch (error) {
			// Don't let one bad file abort migration for the rest--the pre-migration
			// backup means this is recoverable. Leaving the flat file in place (move()
			// only moves on success) means it just won't be picked up by loadStories()
			// until manually resolved.
			console.warn(`Could not migrate ${entry.name}: ${error}`);
		}
	}

	await setAppPref('storiesMigratedToFolders', true);
}
