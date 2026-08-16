import {Story} from '../../store/stories/stories.types';
import {StoryAsset, StoryAssetKind} from '../main-process/story-assets.types';
import {StorySidecar} from '../main-process/story-sidecar.types';

export interface TwineElectronWindow extends Window {
	twineElectron?: {
		deleteStory(story: Story): void;
		deleteStoryAsset(
			story: Story,
			kind: StoryAssetKind,
			name: string
		): Promise<void>;
		importStoryAsset(
			story: Story,
			kind: StoryAssetKind
		): Promise<StoryAsset[]>;
		listStoryAssets(story: Story): Promise<StoryAsset[]>;
		loadPrefs(): Promise<any>;
		loadStories(): Promise<any>;
		loadStoryFormats(): Promise<any>;
		loadStorySidecar(story: Story): Promise<StorySidecar>;
		onceStoryRenamed(callback: () => void): void;
		openWithScratchFile(data: string, story: Story): void;
		renameStory(oldStory: Story, newStory: Story): void;
		revealStoryAsset(
			story: Story,
			kind: StoryAssetKind,
			name: string
		): Promise<void>;
		saveStoryHtml(story: Story, data: string): void;
		saveStorySidecar(story: Story, data: StorySidecar): Promise<void>;
		saveJson(filename: string, data: any): void;
	};
}
