import * as React from 'react';
import {hexToRgba} from './generate-css';
import {LayoutTokens, resolveFontInfo} from './layout-tokens';

const JUSTIFY_BY_POSITION = {
	top: 'flex-start',
	center: 'center',
	bottom: 'flex-end'
} as const;

export interface LayoutMockPreviewProps {
	tokens: LayoutTokens;
	/** The user's saved custom Google Fonts (prefs.customGoogleFonts), needed
	 * to resolve tokens.font when it isn't one of the built-in LAYOUT_FONTS. */
	customFonts: Record<string, string>;
	/** Absolute filesystem path to the chosen backdrop image, if any--see
	 * StoryAsset.absolutePath; a relative path can't resolve here since this
	 * renders in the app's own window, not the story's folder. */
	backdropAbsolutePath?: string;
	/** Absolute filesystem path to the chosen left panel image, if any--same
	 * reasoning as backdropAbsolutePath. */
	leftPanelAbsolutePath?: string;
	anchorImageLabel: string;
	leftPanelLabel: string;
	previewText: string;
	previewLinkText: string;
}

/**
 * A simplified live preview of the game screen reflecting the current
 * tokens. This is Twine121's own UI, not real Harlowe/Chapbook output--it
 * previews layout (colors, positions, box shape), not exact rendering, which
 * is already provable via the real Play/Test button.
 */
export const LayoutMockPreview: React.FC<LayoutMockPreviewProps> = props => {
	const {
		tokens,
		customFonts,
		backdropAbsolutePath,
		leftPanelAbsolutePath,
		anchorImageLabel,
		leftPanelLabel,
		previewText,
		previewLinkText
	} = props;
	const font = resolveFontInfo(tokens.font, customFonts);
	const hasLeftPanel = tokens.leftPanelWidth > 0;

	const stageStyle: React.CSSProperties = {
		backgroundColor: tokens.backgroundColor,
		color: tokens.textColor,
		fontFamily: font.googleName ? font.harloweFamily : undefined,
		fontSize: tokens.baseFontSize,
		backgroundImage: backdropAbsolutePath
			? `url("file://${backdropAbsolutePath}")`
			: undefined
	};
	const contentStyle: React.CSSProperties = {
		display: 'flex',
		flex: 1,
		flexDirection: 'column',
		justifyContent: JUSTIFY_BY_POSITION[tokens.dialogueBoxPosition],
		paddingLeft: hasLeftPanel ? tokens.leftPanelWidth : undefined
	};
	const leftPanelStyle: React.CSSProperties = {
		width: tokens.leftPanelWidth,
		backgroundColor: '#333333',
		backgroundImage: leftPanelAbsolutePath
			? `url("file://${leftPanelAbsolutePath}")`
			: undefined
	};
	const anchorPlaceholderStyle: React.CSSProperties = {
		marginBottom: tokens.anchorImageGap,
		maxWidth: tokens.stageMaxWidth,
		margin: tokens.alignLeft ? `0 auto 0 ${tokens.leftGap}px` : '0 auto',
		width: '100%',
		boxSizing: 'border-box'
	};
	const boxStyle: React.CSSProperties = {
		maxWidth: tokens.stageMaxWidth,
		padding: tokens.dialogueBoxPadding,
		minHeight:
			tokens.dialogueBoxHeight > 0 ? tokens.dialogueBoxHeight : undefined,
		backgroundColor:
			tokens.dialogueBoxOpacity < 100
				? hexToRgba(tokens.backgroundColor, tokens.dialogueBoxOpacity / 100)
				: undefined,
		margin: tokens.alignLeft ? `0 auto 0 ${tokens.leftGap}px` : undefined
	};

	return (
		<div className="layout-mock-stage" style={stageStyle}>
			{hasLeftPanel && (
				<div className="layout-mock-left-panel" style={leftPanelStyle}>
					{!leftPanelAbsolutePath && (
						<span className="layout-mock-left-panel-label">
							{leftPanelLabel}
						</span>
					)}
				</div>
			)}
			<div className="layout-mock-content" style={contentStyle}>
				<div
					className="layout-mock-anchor-placeholder"
					style={anchorPlaceholderStyle}
				>
					{anchorImageLabel}
				</div>
				<div className="layout-mock-box" style={boxStyle}>
					<p>{previewText}</p>
					<a
						href="#"
						onClick={e => e.preventDefault()}
						style={{color: tokens.linkColor}}
					>
						{previewLinkText}
					</a>
				</div>
			</div>
		</div>
	);
};
