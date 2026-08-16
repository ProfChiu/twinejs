import * as React from 'react';
import {isElectronRenderer} from '../../util/is-electron';
import {TwineElectronWindow} from '../../electron/shared';
import {Story} from '../../store/stories';
import {
	StoryAsset,
	StoryAssetKind
} from '../../electron/main-process/story-assets.types';

export interface UseStoryAssetsProps {
	assets: StoryAsset[];
	deleteAsset: (asset: StoryAsset) => Promise<void>;
	error?: string;
	importAsset: (kind: StoryAssetKind) => Promise<StoryAsset[]>;
	loading: boolean;
	revealAsset: (asset: StoryAsset) => Promise<void>;
}

/**
 * Provides a story's images/sounds and functions to manage them, backed by
 * the Twine121 asset IPC channels. Only meaningful in Electron--the browser
 * build has no filesystem to manage, so callers should gate the whole
 * asset panel on isElectronRenderer() rather than relying on this hook to
 * degrade gracefully in a browser context.
 */
export function useStoryAssets(story: Story): UseStoryAssetsProps {
	const [assets, setAssets] = React.useState<StoryAsset[]>([]);
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState<string>();
	const twineElectron = isElectronRenderer()
		? (window as TwineElectronWindow).twineElectron
		: undefined;

	const refresh = React.useCallback(async () => {
		if (!twineElectron) {
			return;
		}

		setLoading(true);

		try {
			setAssets(await twineElectron.listStoryAssets(story));
			setError(undefined);
		} catch (e) {
			setError((e as Error).message);
		} finally {
			setLoading(false);
		}
	}, [story, twineElectron]);

	React.useEffect(() => {
		refresh();
	}, [refresh]);

	const importAsset = React.useCallback(
		async (kind: StoryAssetKind) => {
			if (!twineElectron) {
				return [];
			}

			let imported: StoryAsset[];

			try {
				imported = await twineElectron.importStoryAsset(story, kind);
			} catch (e) {
				setError((e as Error).message);
				return [];
			}

			await refresh();
			return imported;
		},
		[refresh, story, twineElectron]
	);

	const deleteAsset = React.useCallback(
		async (asset: StoryAsset) => {
			if (!twineElectron) {
				return;
			}

			try {
				await twineElectron.deleteStoryAsset(story, asset.kind, asset.name);
			} catch (e) {
				setError((e as Error).message);
				return;
			}

			await refresh();
		},
		[refresh, story, twineElectron]
	);

	const revealAsset = React.useCallback(
		async (asset: StoryAsset) => {
			if (!twineElectron) {
				return;
			}

			await twineElectron.revealStoryAsset(story, asset.kind, asset.name);
		},
		[story, twineElectron]
	);

	return {assets, deleteAsset, error, importAsset, loading, revealAsset};
}
