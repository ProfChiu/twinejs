// Exposes a limited set of Electron modules to a renderer process. Because the
// renderer processes load remote content (e.g. story formats), they must be
// isolated.
//
// For now, we cannot use context isolation here because of jsonp. For jsonp
// loading to work, it expects a global property to be set--but because it
// crosses a context boundary, that global is in the wrong place. For now, we
// place a privileged jsonp function into renderer context.

import {contextBridge, ipcRenderer} from 'electron';
import {Story} from '../../store/stories/stories.types';
import {StoryAssetKind} from './story-assets.types';
import {StorySidecar} from './story-sidecar.types';

contextBridge.exposeInMainWorld('twineElectron', {
	deleteStory(story: Story) {
		ipcRenderer.send('delete-story', story);
	},
	deleteStoryAsset(story: Story, kind: StoryAssetKind, name: string) {
		return ipcRenderer.invoke('delete-story-asset', story, kind, name);
	},
	importStoryAsset(story: Story, kind: StoryAssetKind) {
		return ipcRenderer.invoke('import-story-asset', story, kind);
	},
	listStoryAssets(story: Story) {
		return ipcRenderer.invoke('list-story-assets', story);
	},
	loadStorySidecar(story: Story) {
		return ipcRenderer.invoke('load-story-sidecar', story);
	},
	revealStoryAsset(story: Story, kind: StoryAssetKind, name: string) {
		return ipcRenderer.invoke('reveal-story-asset', story, kind, name);
	},
	saveStorySidecar(story: Story, data: StorySidecar) {
		return ipcRenderer.invoke('save-story-sidecar', story, data);
	},
	loadPrefs() {
		return ipcRenderer.invoke('load-prefs');
	},
	loadStories() {
		return ipcRenderer.invoke('load-stories');
	},
	loadStoryFormats() {
		return ipcRenderer.invoke('load-story-formats');
	},
	onceStoryRenamed(callback: () => void): void {
		ipcRenderer.once('story-renamed', callback);
	},
	openWithScratchFile(data: string, story: Story) {
		ipcRenderer.send('open-with-scratch-file', data, story);
	},
	renameStory(oldStory: Story, newStory: Story) {
		ipcRenderer.send('rename-story', oldStory, newStory);
	},
	saveJson(filename: string, data: any) {
		ipcRenderer.send('save-json', filename, data);
	},
	saveStoryHtml(story: Story, data: string) {
		ipcRenderer.send('save-story-html', story, data);
	}
});