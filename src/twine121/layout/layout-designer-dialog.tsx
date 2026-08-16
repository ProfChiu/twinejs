import {IconCheck, IconPlus, IconTrash, IconX} from '@tabler/icons';
import * as React from 'react';
import {useTranslation} from 'react-i18next';
import {ButtonBar} from '../../components/container/button-bar';
import {DialogCard} from '../../components/container/dialog-card';
import {CardContent} from '../../components/container/card';
import {CheckboxButton} from '../../components/control/checkbox-button';
import {IconButton} from '../../components/control/icon-button';
import {TextInput} from '../../components/control/text-input';
import {TextSelect} from '../../components/control/text-select';
import {DialogComponentProps} from '../../dialogs';
import {setPref, usePrefsContext} from '../../store/prefs';
import {storyWithId, useStoriesContext} from '../../store/stories';
import {useStoryAssets} from '../assets';
import {useLayoutTokens} from './use-layout-tokens';
import {LayoutColorField, LayoutSlider} from './layout-controls';
import {LayoutMockPreview} from './layout-mock-preview';
import {isChapbookFormat} from '../format';
import {
	applyPreset,
	DialogueBoxPosition,
	LAYOUT_FONTS,
	LAYOUT_FONT_IDS,
	LAYOUT_PRESETS,
	LAYOUT_PRESET_IDS,
	LayoutPresetId,
	extractGoogleFontName,
	resolveFontInfo
} from './layout-tokens';
import './layout-designer-dialog.css';

const ADD_CUSTOM_FONT_VALUE = '__add_custom_font__';
const IMPORT_IMAGE_VALUE = '__import_image__';
const FONT_FALLBACK_OPTIONS = ['serif', 'sans-serif', 'monospace', 'cursive'];

export interface LayoutDesignerDialogProps extends DialogComponentProps {
	storyId: string;
}

export const LayoutDesignerDialog: React.FC<
	LayoutDesignerDialogProps
> = props => {
	const {storyId, ...other} = props;
	const {stories} = useStoriesContext();
	const story = storyWithId(stories, storyId);
	const {tokens, updateTokens} = useLayoutTokens(story);
	const {assets, importAsset} = useStoryAssets(story);
	const {dispatch: prefsDispatch, prefs} = usePrefsContext();
	const {t} = useTranslation();
	const chapbook = isChapbookFormat(story.storyFormat);
	const chapbookNote = chapbook
		? t('dialogs.layoutDesigner.chapbookLimitNote')
		: undefined;
	const [addingCustomFont, setAddingCustomFont] = React.useState(false);
	const [newFontUrl, setNewFontUrl] = React.useState('');
	const [newFontName, setNewFontName] = React.useState('');
	const [newFontFallback, setNewFontFallback] = React.useState(
		FONT_FALLBACK_OPTIONS[0]
	);

	const images = assets.filter(asset => asset.kind === 'images');
	const backdropAsset = images.find(
		asset => asset.relativePath === tokens.backdropImage
	);
	const leftPanelAsset = images.find(
		asset => asset.relativePath === tokens.leftPanelImage
	);

	function handleFontChange(value: string) {
		if (value === ADD_CUSTOM_FONT_VALUE) {
			setAddingCustomFont(true);
			return;
		}

		setAddingCustomFont(false);
		updateTokens({font: value});
	}

	function handleFontUrlChange(value: string) {
		setNewFontUrl(value);
		setNewFontName(extractGoogleFontName(value));
	}

	async function handleImagePickerChange(
		value: string,
		tokenKey: 'backdropImage' | 'leftPanelImage'
	) {
		if (value === IMPORT_IMAGE_VALUE) {
			const imported = await importAsset('images');

			if (imported.length > 0) {
				updateTokens({[tokenKey]: imported[0].relativePath});
			}

			return;
		}

		updateTokens({[tokenKey]: value});
	}

	function updatePassageBackground(
		index: number,
		patch: Partial<{tag: string; image: string}>
	) {
		updateTokens({
			passageBackgrounds: tokens.passageBackgrounds.map((bg, i) =>
				i === index ? {...bg, ...patch} : bg
			)
		});
	}

	async function handlePassageBackgroundImage(index: number, value: string) {
		if (value === IMPORT_IMAGE_VALUE) {
			const imported = await importAsset('images');

			if (imported.length > 0) {
				updatePassageBackground(index, {image: imported[0].relativePath});
			}

			return;
		}

		updatePassageBackground(index, {image: value});
	}

	function handleAddCustomFont() {
		const name = newFontName.trim();

		if (!name) {
			return;
		}

		prefsDispatch(
			setPref('customGoogleFonts', {
				...prefs.customGoogleFonts,
				[name]: newFontFallback
			})
		);
		updateTokens({font: name});
		setAddingCustomFont(false);
		setNewFontUrl('');
		setNewFontName('');
	}

	// Loads the chosen Google Font into this dialog's own document so the
	// preview reflects it--harmless to call repeatedly, since fonts.google
	// links are deduped by href before adding.
	React.useEffect(() => {
		const font = resolveFontInfo(tokens.font, prefs.customGoogleFonts);

		if (!font.googleName) {
			return;
		}

		const href = `https://fonts.googleapis.com/css2?family=${font.googleName}&display=swap`;

		if (document.querySelector(`link[href="${href}"]`)) {
			return;
		}

		const link = document.createElement('link');

		link.rel = 'stylesheet';
		link.href = href;
		document.head.appendChild(link);
	}, [tokens.font, prefs.customGoogleFonts]);

	return (
		<DialogCard
			{...other}
			className="layout-designer-dialog"
			headerLabel={t('dialogs.layoutDesigner.title')}
			maximizable
		>
			<CardContent>
				<div className="layout-designer-columns">
					<div className="layout-designer-controls">
						<TextSelect
							onChange={e =>
								updateTokens(
									applyPreset(tokens, e.target.value as LayoutPresetId)
								)
							}
							options={LAYOUT_PRESET_IDS.map(id => ({
								value: id,
								label: LAYOUT_PRESETS[id].label
							}))}
							value={tokens.preset}
						>
							{t('dialogs.layoutDesigner.presetLabel')}
						</TextSelect>

						<TextSelect
							onChange={e => handleFontChange(e.target.value)}
							options={[
								...LAYOUT_FONT_IDS.map(id => ({
									value: id,
									label: LAYOUT_FONTS[id].label
								})),
								...Object.keys(prefs.customGoogleFonts).map(name => ({
									value: name,
									label: name
								})),
								{
									value: ADD_CUSTOM_FONT_VALUE,
									label: t('dialogs.layoutDesigner.addCustomFontOption')
								}
							]}
							value={addingCustomFont ? ADD_CUSTOM_FONT_VALUE : tokens.font}
						>
							{t('dialogs.layoutDesigner.fontLabel')}
						</TextSelect>

						{addingCustomFont && (
							<div className="layout-add-custom-font">
								<TextInput
									onChange={e => handleFontUrlChange(e.target.value)}
									placeholder="https://fonts.google.com/specimen/..."
									value={newFontUrl}
								>
									{t('dialogs.layoutDesigner.customFontUrlLabel')}
								</TextInput>
								<div className="layout-add-custom-font-fields">
									<TextInput
										onChange={e => setNewFontName(e.target.value)}
										value={newFontName}
									>
										{t('dialogs.layoutDesigner.customFontNameLabel')}
									</TextInput>
									<TextSelect
										onChange={e => setNewFontFallback(e.target.value)}
										options={FONT_FALLBACK_OPTIONS.map(family => ({
											value: family,
											label: family
										}))}
										value={newFontFallback}
									>
										{t('dialogs.layoutDesigner.customFontFallbackLabel')}
									</TextSelect>
								</div>
								<ButtonBar>
									<IconButton
										disabled={!newFontName.trim()}
										icon={<IconCheck />}
										label={t('dialogs.layoutDesigner.addCustomFontConfirm')}
										onClick={handleAddCustomFont}
									/>
									<IconButton
										icon={<IconX />}
										label={t('common.cancel')}
										onClick={() => {
											setAddingCustomFont(false);
											setNewFontUrl('');
											setNewFontName('');
										}}
									/>
								</ButtonBar>
							</div>
						)}

						<LayoutSlider
							label={t('dialogs.layoutDesigner.anchorImageGapLabel')}
							max={120}
							min={0}
							note={
								chapbookNote ?? t('dialogs.layoutDesigner.anchorImageGapNote')
							}
							onChange={v => updateTokens({anchorImageGap: v})}
							unit="px"
							value={tokens.anchorImageGap}
						/>

						<LayoutSlider
							label={t('dialogs.layoutDesigner.baseFontSizeLabel')}
							max={36}
							min={10}
							onChange={v => updateTokens({baseFontSize: v})}
							unit="px"
							value={tokens.baseFontSize}
						/>

						<div className="layout-color-row">
							<LayoutColorField
								label={t('dialogs.layoutDesigner.textColorLabel')}
								onChange={v => updateTokens({textColor: v})}
								value={tokens.textColor}
							/>
							<LayoutColorField
								label={t('dialogs.layoutDesigner.backgroundColorLabel')}
								onChange={v => updateTokens({backgroundColor: v})}
								value={tokens.backgroundColor}
							/>
							<LayoutColorField
								label={t('dialogs.layoutDesigner.linkColorLabel')}
								onChange={v => updateTokens({linkColor: v})}
								value={tokens.linkColor}
							/>
						</div>

						<LayoutSlider
							label={t('dialogs.layoutDesigner.stageMaxWidthLabel')}
							max={1200}
							min={320}
							note={chapbookNote}
							onChange={v => updateTokens({stageMaxWidth: v})}
							step={10}
							unit="px"
							value={tokens.stageMaxWidth}
						/>

						<CheckboxButton
							label={t('dialogs.layoutDesigner.alignLeftLabel')}
							onChange={v => updateTokens({alignLeft: v})}
							value={tokens.alignLeft}
						/>
						{tokens.alignLeft && (
							<LayoutSlider
								label={t('dialogs.layoutDesigner.leftGapLabel')}
								max={400}
								min={0}
								note={chapbookNote ?? t('dialogs.layoutDesigner.leftGapNote')}
								onChange={v => updateTokens({leftGap: v})}
								step={10}
								unit="px"
								value={tokens.leftGap}
								zeroLabel={t('dialogs.layoutDesigner.leftGapFlush')}
							/>
						)}
						{chapbookNote && (
							<p className="layout-designer-note" style={{marginTop: -4, marginBottom: 8}}>
								{chapbookNote}
							</p>
						)}

						<TextSelect
							onChange={e =>
								updateTokens({
									dialogueBoxPosition: e.target.value as DialogueBoxPosition
								})
							}
							options={[
								{
									value: 'top',
									label: t('dialogs.layoutDesigner.dialogueBoxPositionTop')
								},
								{
									value: 'center',
									label: t('dialogs.layoutDesigner.dialogueBoxPositionCenter')
								},
								{
									value: 'bottom',
									label: t('dialogs.layoutDesigner.dialogueBoxPositionBottom')
								}
							]}
							value={tokens.dialogueBoxPosition}
						>
							{t('dialogs.layoutDesigner.dialogueBoxPositionLabel')}
						</TextSelect>

						<LayoutSlider
							label={t('dialogs.layoutDesigner.dialogueBoxHeightLabel')}
							max={500}
							min={0}
							note={chapbookNote}
							onChange={v => updateTokens({dialogueBoxHeight: v})}
							step={10}
							unit="px"
							value={tokens.dialogueBoxHeight}
							zeroLabel={t('dialogs.layoutDesigner.dialogueBoxHeightAuto')}
						/>

						<LayoutSlider
							label={t('dialogs.layoutDesigner.dialogueBoxPaddingLabel')}
							max={60}
							min={0}
							note={chapbookNote}
							onChange={v => updateTokens({dialogueBoxPadding: v})}
							unit="px"
							value={tokens.dialogueBoxPadding}
						/>

						<LayoutSlider
							label={t('dialogs.layoutDesigner.dialogueBoxOpacityLabel')}
							max={100}
							min={0}
							note={chapbookNote}
							onChange={v => updateTokens({dialogueBoxOpacity: v})}
							unit="%"
							value={tokens.dialogueBoxOpacity}
						/>

						<TextSelect
							onChange={e =>
								handleImagePickerChange(e.target.value, 'backdropImage')
							}
							options={[
								{
									value: '',
									label: t('dialogs.layoutDesigner.backdropImageNone')
								},
								...images.map(asset => ({
									value: asset.relativePath,
									label: asset.name
								})),
								{
									value: IMPORT_IMAGE_VALUE,
									label: t('dialogs.layoutDesigner.importImageOption')
								}
							]}
							value={tokens.backdropImage}
						>
							{t('dialogs.layoutDesigner.backdropImageLabel')}
						</TextSelect>

						<TextSelect
							onChange={e =>
								handleImagePickerChange(e.target.value, 'leftPanelImage')
							}
							options={[
								{
									value: '',
									label: t('dialogs.layoutDesigner.leftPanelImageNone')
								},
								...images.map(asset => ({
									value: asset.relativePath,
									label: asset.name
								})),
								{
									value: IMPORT_IMAGE_VALUE,
									label: t('dialogs.layoutDesigner.importImageOption')
								}
							]}
							value={tokens.leftPanelImage}
						>
							{t('dialogs.layoutDesigner.leftPanelImageLabel')}
						</TextSelect>

						<LayoutSlider
							label={t('dialogs.layoutDesigner.leftPanelWidthLabel')}
							max={400}
							min={0}
							note={chapbookNote}
							onChange={v => updateTokens({leftPanelWidth: v})}
							step={10}
							unit="px"
							value={tokens.leftPanelWidth}
							zeroLabel={t('dialogs.layoutDesigner.leftPanelWidthNone')}
						/>

						<div className="layout-passage-backgrounds">
							<span className="layout-passage-backgrounds-label">
								{t('dialogs.layoutDesigner.passageBackgroundsLabel')}
							</span>
							{chapbookNote && (
								<p className="layout-designer-note">{chapbookNote}</p>
							)}
							{tokens.passageBackgrounds.map((bg, index) => (
								<div className="layout-passage-bg-row" key={index}>
									<TextInput
										onChange={e =>
											updatePassageBackground(index, {tag: e.target.value})
										}
										placeholder={t(
											'dialogs.layoutDesigner.passageBackgroundTagPlaceholder'
										)}
										value={bg.tag}
									>
										{t('dialogs.layoutDesigner.passageBackgroundTagLabel')}
									</TextInput>
									<TextSelect
										onChange={e =>
											handlePassageBackgroundImage(index, e.target.value)
										}
										options={[
											{
												value: '',
												label: t(
													'dialogs.layoutDesigner.passageBackgroundImageNone'
												)
											},
											...images.map(asset => ({
												value: asset.relativePath,
												label: asset.name
											})),
											{
												value: IMPORT_IMAGE_VALUE,
												label: t('dialogs.layoutDesigner.importImageOption')
											}
										]}
										value={bg.image}
									>
										{t('dialogs.layoutDesigner.passageBackgroundImageLabel')}
									</TextSelect>
									<IconButton
										icon={<IconTrash />}
										iconOnly
										label={t('common.remove')}
										onClick={() =>
											updateTokens({
												passageBackgrounds: tokens.passageBackgrounds.filter(
													(_, i) => i !== index
												)
											})
										}
									/>
								</div>
							))}
							<IconButton
								icon={<IconPlus />}
								label={t('dialogs.layoutDesigner.passageBackgroundAdd')}
								onClick={() =>
									updateTokens({
										passageBackgrounds: [
											...tokens.passageBackgrounds,
											{tag: '', image: ''}
										]
									})
								}
							/>
						</div>

						<CheckboxButton
							label={t('dialogs.layoutDesigner.hideSidebarLabel')}
							onChange={v => updateTokens({hideSidebar: v})}
							value={tokens.hideSidebar}
						/>

						<CheckboxButton
							label={t('dialogs.layoutDesigner.hideDebuggerLabel')}
							onChange={v => updateTokens({hideDebugger: v})}
							value={tokens.hideDebugger}
						/>

						{chapbookNote && (
							<p className="layout-designer-note">{chapbookNote}</p>
						)}
					</div>

					<div className="layout-designer-preview">
						<h3>{t('dialogs.layoutDesigner.previewHeading')}</h3>
						<LayoutMockPreview
							anchorImageLabel={t(
								'dialogs.layoutDesigner.anchorImagePlaceholder'
							)}
							backdropAbsolutePath={backdropAsset?.absolutePath}
							customFonts={prefs.customGoogleFonts}
							leftPanelAbsolutePath={leftPanelAsset?.absolutePath}
							leftPanelLabel={t('dialogs.layoutDesigner.leftPanelPlaceholder')}
							previewLinkText={t('dialogs.layoutDesigner.previewSampleLink')}
							previewText={t('dialogs.layoutDesigner.previewSampleText')}
							tokens={tokens}
						/>
					</div>
				</div>
			</CardContent>
		</DialogCard>
	);
};
