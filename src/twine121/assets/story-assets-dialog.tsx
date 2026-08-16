import {
	IconAnchor,
	IconCheck,
	IconCopy,
	IconFolder,
	IconMusic,
	IconPhoto,
	IconTrash,
	IconUpload
} from '@tabler/icons';
import * as React from 'react';
import {useTranslation} from 'react-i18next';
import {DialogCard} from '../../components/container/dialog-card';
import {CardContent} from '../../components/container/card';
import {ButtonBar} from '../../components/container/button-bar';
import {ConfirmButton} from '../../components/control/confirm-button';
import {IconButton} from '../../components/control/icon-button';
import {DialogComponentProps} from '../../dialogs';
import {storyWithId, useStoriesContext} from '../../store/stories';
import {StoryAsset} from '../../electron/main-process/story-assets.types';
import {isChapbookFormat} from '../format';
import {useStoryAssets} from './use-story-assets';
import {checkAssetReferences} from './validate';
import './story-assets-dialog.css';

export interface StoryAssetsDialogProps extends DialogComponentProps {
	storyId: string;
}

/**
 * Returns HTML markup that references an asset by its relative path. Uses
 * plain <img>/<audio> tags rather than a story-format-specific macro--both
 * Harlowe and Chapbook render passage text as HTML, so this works
 * identically in either format and matches what LearnTwine's own Sound &
 * Image chapter teaches, instead of risking a fabricated macro syntax.
 */
function insertSnippetFor(asset: StoryAsset) {
	return asset.kind === 'images'
		? `<img src="${asset.relativePath}">`
		: `<audio controls src="${asset.relativePath}"></audio>`;
}

/**
 * Returns markup for inserting an image as a per-passage "anchor image"--the
 * Layout Designer's Anchor Image Gap control styles any image tagged this
 * way. Harlowe uses the class="scene" convention LearnTwine Ch. 7 already
 * teaches; Chapbook has no equivalent CSS hook, so this uses Chapbook's own
 * verified {embed image:...} passage insert instead (Ch. 7's "Demo scene"
 * answer)--the Layout Designer's gap control has no effect there, which its
 * Chapbook note already says.
 */
function anchorSnippetFor(asset: StoryAsset, chapbook: boolean) {
	if (chapbook) {
		const alt = asset.name.replace(/\.[^.]+$/, '');

		return `{embed image: '${asset.relativePath}', alt: '${alt}'}`;
	}

	return `<img class="scene" src="${asset.relativePath}">`;
}

export const StoryAssetsDialog: React.FC<StoryAssetsDialogProps> = props => {
	const {storyId, ...other} = props;
	const {stories} = useStoriesContext();
	const story = storyWithId(stories, storyId);
	const {assets, deleteAsset, error, importAsset, loading, revealAsset} =
		useStoryAssets(story);
	const [copiedKey, setCopiedKey] = React.useState<string>();
	const {t} = useTranslation();
	const chapbook = isChapbookFormat(story.storyFormat);
	const issues = React.useMemo(
		() => checkAssetReferences(story, assets),
		[story, assets]
	);

	async function copySnippet(key: string, snippet: string) {
		await navigator.clipboard.writeText(snippet);
		setCopiedKey(key);
		window.setTimeout(() => setCopiedKey(undefined), 1500);
	}

	function handleInsert(asset: StoryAsset) {
		return copySnippet(`${asset.name}:insert`, insertSnippetFor(asset));
	}

	function handleInsertAnchor(asset: StoryAsset) {
		return copySnippet(
			`${asset.name}:anchor`,
			anchorSnippetFor(asset, chapbook)
		);
	}

	function renderAssetGroup(kind: 'images' | 'sounds') {
		const groupAssets = assets.filter(asset => asset.kind === kind);

		return (
			<div className="story-assets-group">
				<div className="story-assets-group-header">
					<h3>{t(`dialogs.storyAssets.${kind}`)}</h3>
					<IconButton
						icon={<IconUpload />}
						label={t(
							kind === 'images'
								? 'dialogs.storyAssets.importImage'
								: 'dialogs.storyAssets.importSound'
						)}
						onClick={() => importAsset(kind)}
					/>
				</div>
				{groupAssets.length === 0 ? (
					<p className="story-assets-empty">
						{t(
							kind === 'images'
								? 'dialogs.storyAssets.noImages'
								: 'dialogs.storyAssets.noSounds'
						)}
					</p>
				) : (
					<ul className="story-assets-list">
						{groupAssets.map(asset => (
							<li className="story-assets-row" key={asset.name}>
								{kind === 'images' ? <IconPhoto /> : <IconMusic />}
								<span className="story-assets-name">{asset.name}</span>
								<ButtonBar>
									<IconButton
										icon={
											copiedKey === `${asset.name}:insert` ? (
												<IconCheck />
											) : (
												<IconCopy />
											)
										}
										label={t(
											copiedKey === `${asset.name}:insert`
												? 'dialogs.storyAssets.copied'
												: 'dialogs.storyAssets.insert'
										)}
										onClick={() => handleInsert(asset)}
									/>
									{kind === 'images' && (
										<IconButton
											icon={
												copiedKey === `${asset.name}:anchor` ? (
													<IconCheck />
												) : (
													<IconAnchor />
												)
											}
											label={t(
												copiedKey === `${asset.name}:anchor`
													? 'dialogs.storyAssets.copied'
													: 'dialogs.storyAssets.insertAnchor'
											)}
											onClick={() => handleInsertAnchor(asset)}
										/>
									)}
									<IconButton
										icon={<IconFolder />}
										iconOnly
										label={t('dialogs.storyAssets.reveal')}
										onClick={() => revealAsset(asset)}
									/>
									<ConfirmButton
										confirmIcon={<IconTrash />}
										confirmLabel={t('dialogs.storyAssets.delete')}
										confirmVariant="danger"
										icon={<IconTrash />}
										iconOnly
										label={t('dialogs.storyAssets.delete')}
										onConfirm={() => deleteAsset(asset)}
										prompt={t('dialogs.storyAssets.deletePrompt', {
											name: asset.name
										})}
									/>
								</ButtonBar>
							</li>
						))}
					</ul>
				)}
			</div>
		);
	}

	return (
		<DialogCard
			{...other}
			className="story-assets-dialog"
			fixedSize
			headerLabel={t('dialogs.storyAssets.title')}
		>
			<CardContent>
				{error && (
					<p className="story-assets-error">
						{t('dialogs.storyAssets.loadError', {message: error})}
					</p>
				)}
				{!loading && issues.length > 0 && (
					<div className="story-assets-issues">
						<h3>{t('dialogs.storyAssets.issuesTitle')}</h3>
						<ul>
							{issues.map((issue, index) => (
								<li key={index}>
									{t(
										issue.type === 'missing'
											? 'dialogs.storyAssets.issueMissing'
											: 'dialogs.storyAssets.issueOutsideAssetsFolder',
										{
											path: issue.path,
											location:
												issue.passageName ??
												t('dialogs.storyAssets.issueLocationStylesheet')
										}
									)}
								</li>
							))}
						</ul>
					</div>
				)}
				{!loading && (
					<>
						{renderAssetGroup('images')}
						{renderAssetGroup('sounds')}
					</>
				)}
			</CardContent>
		</DialogCard>
	);
};
