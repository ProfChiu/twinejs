import {dialog, shell} from 'electron';
import {copy, readdir, remove} from 'fs-extra';
import {basename, join} from 'path';
import {Story} from '../../store/stories/stories.types';
import {ensureStoryAssetFolders, getStoryFolderPath} from './story-file';
import {StoryAsset, StoryAssetKind} from './story-assets.types';

const EXTENSIONS_BY_KIND: Record<StoryAssetKind, string[]> = {
	images: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'],
	sounds: ['mp3', 'wav', 'ogg', 'm4a', 'aac']
};

function assetFolderPath(story: Story, kind: StoryAssetKind) {
	return join(getStoryFolderPath(story), kind);
}

async function listAssetsInFolder(
	story: Story,
	kind: StoryAssetKind
): Promise<StoryAsset[]> {
	try {
		const entries = await readdir(assetFolderPath(story, kind), {
			withFileTypes: true
		});

		return entries
			.filter(entry => entry.isFile())
			.map(entry => ({
				kind,
				name: entry.name,
				relativePath: `${kind}/${entry.name}`,
				absolutePath: join(assetFolderPath(story, kind), entry.name)
			}));
	} catch (error) {
		// The folder doesn't exist yet--e.g. a brand-new story that hasn't been
		// saved, so ensureStoryAssetFolders() has never run for it.
		return [];
	}
}

/**
 * Lists every file in a story's images/ and sounds/ subfolders.
 */
export async function listStoryAssets(story: Story): Promise<StoryAsset[]> {
	const [images, sounds] = await Promise.all([
		listAssetsInFolder(story, 'images'),
		listAssetsInFolder(story, 'sounds')
	]);

	return [...images, ...sounds];
}

/**
 * Shows a native file picker scoped to the requested kind, then copies
 * whatever the user chose into the story's images/ or sounds/ subfolder.
 * Returns the assets that were imported (empty if the user canceled).
 */
export async function importStoryAsset(
	story: Story,
	kind: StoryAssetKind
): Promise<StoryAsset[]> {
	const storyFolderPath = await ensureStoryAssetFolders(story);
	const folderPath = join(storyFolderPath, kind);
	const {canceled, filePaths} = await dialog.showOpenDialog({
		properties: ['openFile', 'multiSelections'],
		filters: [
			{
				name: kind === 'images' ? 'Images' : 'Sounds',
				extensions: EXTENSIONS_BY_KIND[kind]
			}
		]
	});

	if (canceled) {
		return [];
	}

	const imported: StoryAsset[] = [];

	for (const sourcePath of filePaths) {
		const name = basename(sourcePath);

		await copy(sourcePath, join(folderPath, name), {overwrite: true});
		imported.push({
			kind,
			name,
			relativePath: `${kind}/${name}`,
			absolutePath: join(folderPath, name)
		});
	}

	return imported;
}

/**
 * Deletes an asset file from a story's images/ or sounds/ subfolder.
 */
export async function deleteStoryAsset(
	story: Story,
	kind: StoryAssetKind,
	name: string
) {
	await remove(join(assetFolderPath(story, kind), name));
}

/**
 * Reveals an asset file in the system file browser.
 */
export async function revealStoryAsset(
	story: Story,
	kind: StoryAssetKind,
	name: string
) {
	shell.showItemInFolder(join(assetFolderPath(story, kind), name));
}
