import {Story} from '../../store/stories/stories.types';
import {StoryAsset, StoryAssetKind} from '../../electron/main-process/story-assets.types';

export interface AssetReferenceIssue {
	/**
	 * "missing" means the reference points inside images/ or sounds/ but no
	 * such file exists there. "outsideAssetsFolder" means the reference is a
	 * local-looking path that isn't inside images/ or sounds/ at all, so it
	 * won't survive being copied elsewhere (e.g. uploaded to a server).
	 */
	type: 'missing' | 'outsideAssetsFolder';
	path: string;
	/**
	 * Name of the passage the reference was found in, or undefined if it was
	 * found in the story's stylesheet instead.
	 */
	passageName?: string;
}

const SRC_ATTRIBUTE_PATTERN = /\bsrc\s*=\s*["']([^"']+)["']/gi;
const CSS_URL_PATTERN = /\burl\(\s*["']?([^"')]+)["']?\s*\)/gi;

function isHostedOrEmbedded(path: string) {
	return (
		/^(https?:)?\/\//i.test(path) ||
		path.startsWith('data:') ||
		path.startsWith('#')
	);
}

function findReferences(text: string): string[] {
	const paths: string[] = [];

	for (const pattern of [SRC_ATTRIBUTE_PATTERN, CSS_URL_PATTERN]) {
		// Patterns are global, so exec() must be called repeatedly on a copy to
		// find every match--reusing a global RegExp's lastIndex across calls is
		// an easy source of bugs, so a fresh one is created per text scanned.
		const re = new RegExp(pattern.source, pattern.flags);
		let match: RegExpExecArray | null;

		// eslint-disable-next-line no-cond-assign
		while ((match = re.exec(text))) {
			paths.push(match[1]);
		}
	}

	return paths;
}

function checkReference(
	path: string,
	assetsByKind: Record<StoryAssetKind, Set<string>>
): AssetReferenceIssue['type'] | undefined {
	if (isHostedOrEmbedded(path)) {
		return undefined;
	}

	const normalized = path.replace(/^\.\//, '');
	const match = normalized.match(/^(images|sounds)\/(.+)$/);

	if (!match) {
		return 'outsideAssetsFolder';
	}

	const [, kind, name] = match;

	return assetsByKind[kind as StoryAssetKind].has(name) ? undefined : 'missing';
}

/**
 * Scans a story's passages and stylesheet for local image/sound references
 * (<... src="...">, CSS url(...)) and flags ones that won't work: either
 * because no matching file exists in images/sounds, or because the
 * reference isn't inside images/sounds at all. Hosted http(s) URLs and data:
 * URIs are always considered fine--LearnTwine's Sound & Image chapter
 * deliberately teaches hosted URLs as a first, valid workflow, so this is a
 * guide, not a rule enforcement.
 */
export function checkAssetReferences(
	story: Story,
	assets: StoryAsset[]
): AssetReferenceIssue[] {
	const assetsByKind: Record<StoryAssetKind, Set<string>> = {
		images: new Set(
			assets.filter(asset => asset.kind === 'images').map(asset => asset.name)
		),
		sounds: new Set(
			assets.filter(asset => asset.kind === 'sounds').map(asset => asset.name)
		)
	};
	const issues: AssetReferenceIssue[] = [];

	for (const passage of story.passages) {
		for (const path of findReferences(passage.text)) {
			const type = checkReference(path, assetsByKind);

			if (type) {
				issues.push({type, path, passageName: passage.name});
			}
		}
	}

	for (const path of findReferences(story.stylesheet)) {
		const type = checkReference(path, assetsByKind);

		if (type) {
			issues.push({type, path});
		}
	}

	return issues;
}
