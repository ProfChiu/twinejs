import {readJson, writeJson} from 'fs-extra';
import {loadStorySidecar, saveStorySidecar} from '../story-sidecar';
import {fakeStory} from '../../../test-util';
import {Story} from '../../../store/stories';

jest.mock('../story-file', () => ({
	getStoryFolderPath: (story: any) => `mock-story-folder-${story.id}`
}));

describe('loadStorySidecar', () => {
	const readJsonMock = readJson as jest.Mock;
	let story: Story;

	beforeEach(() => {
		story = fakeStory();
	});

	it('resolves to the parsed sidecar file', async () => {
		readJsonMock.mockResolvedValue({mockKey: 'mock-value'});
		expect(await loadStorySidecar(story)).toEqual({mockKey: 'mock-value'});
		expect(readJsonMock.mock.calls).toEqual([
			[`mock-story-folder-${story.id}/twine121.json`]
		]);
	});

	it("resolves to an empty object if the sidecar file doesn't exist or can't be read", async () => {
		readJsonMock.mockRejectedValue(new Error('mock ENOENT'));
		expect(await loadStorySidecar(story)).toEqual({});
	});
});

describe('saveStorySidecar', () => {
	const writeJsonMock = writeJson as jest.Mock;
	let story: Story;

	beforeEach(() => {
		story = fakeStory();
	});

	it('writes the sidecar file for the story', async () => {
		await saveStorySidecar(story, {mockKey: 'mock-value'});
		expect(writeJsonMock.mock.calls).toEqual([
			[
				`mock-story-folder-${story.id}/twine121.json`,
				{mockKey: 'mock-value'}
			]
		]);
	});

	it('rejects if writing fails', async () => {
		const mockError = new Error();

		writeJsonMock.mockRejectedValue(mockError);
		await expect(saveStorySidecar(story, {})).rejects.toBe(mockError);
	});
});
