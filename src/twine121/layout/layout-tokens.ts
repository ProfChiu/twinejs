export type LayoutPresetId =
	| 'visual-novel'
	| 'centered-book'
	| 'sidebar'
	| 'full-bleed'
	| 'character-panel';

export type LayoutFontId =
	'default' | 'press-start-2p' | 'cinzel' | 'creepster' | 'courier-prime';

export type DialogueBoxPosition = 'top' | 'center' | 'bottom';

export interface PassageBackground {
	/** A passage tag; passages carrying it get this background image. */
	tag: string;
	/** A story asset's relativePath (e.g. "images/cave.png"), or '' for none. */
	image: string;
}

export interface LayoutTokens {
	preset: LayoutPresetId;
	/** One of LAYOUT_FONTS' keys, or a custom Google Font name saved in
	 * prefs.customGoogleFonts--see resolveFontInfo(). */
	font: string;
	baseFontSize: number;
	textColor: string;
	backgroundColor: string;
	linkColor: string;
	stageMaxWidth: number;
	dialogueBoxPosition: DialogueBoxPosition;
	/** 0 means "auto height"--no fixed height is applied. */
	dialogueBoxHeight: number;
	dialogueBoxPadding: number;
	/** 0-100. Below 100, the dialogue box gets a semi-transparent panel behind
	 * its text using backgroundColor at this alpha. */
	dialogueBoxOpacity: number;
	/** A story asset's relativePath (e.g. "images/bg.png"), or '' for none.
	 * Harlowe only--see FONT/PRESET support notes in generate-css.ts. */
	backdropImage: string;
	/** Gap in px between the bottom of a per-passage anchor image (any image
	 * tagged class="scene"--see LearnTwine Ch. 7) and the passage text that
	 * follows it. Harlowe only--Chapbook has no verified per-image spacing
	 * config key. */
	anchorImageGap: number;
	/** Width in px of a reserved left-side panel (e.g. for a character
	 * portrait), or 0 to disable. Harlowe only--see generate-css.ts. */
	leftPanelWidth: number;
	/** A story asset's relativePath for the left panel, or '' for an empty
	 * placeholder. Harlowe only. */
	leftPanelImage: string;
	/** Hides Harlowe's tw-sidebar (the undo/redo/restart icons it shows in the
	 * corner of every page). Harlowe only--Chapbook has no equivalent. */
	hideSidebar: boolean;
	/** Hides Harlowe's tw-debugger (the variable inspector panel it shows
	 * automatically when a story is tested with formatOptions: 'debug'--see
	 * useStoryLaunch's testStory). Harlowe only. */
	hideDebugger: boolean;
	/** Aligns the passage container to the left side of the browser window
	 * instead of centering it. Harlowe only. */
	alignLeft: boolean;
	/** Extra space in px between the window's left edge and the passage
	 * container when alignLeft is on. 0 = flush against the edge. Harlowe only. */
	leftGap: number;
	/** Per-tag passage background images: a passage carrying <tag> gets <image>
	 * behind its text. Harlowe only--Chapbook has no per-passage background. */
	passageBackgrounds: PassageBackground[];
}

export interface LayoutFontInfo {
	label: string;
	/** Google Fonts family param (e.g. "Press+Start+2P"), or null for the
	 * system default (no import, no override). */
	googleName: string | null;
	/** Harlowe font-family value, already quoted/stacked. */
	harloweFamily: string;
	/** Chapbook config.style.page.font value up to (not including) the size,
	 * e.g. "Press Start 2P/monospace"--verified exact for press-start-2p and
	 * courier-prime (LearnTwine Ch. 1/7); cinzel/creepster follow the same
	 * verified "Name/fallback" pattern but haven't been checked against a
	 * live Chapbook story the way those two have. */
	chapbookFont: string | null;
}

export const LAYOUT_FONTS: Record<LayoutFontId, LayoutFontInfo> = {
	default: {
		label: 'Default',
		googleName: null,
		harloweFamily: 'inherit',
		chapbookFont: null
	},
	'press-start-2p': {
		label: 'Press Start 2P',
		googleName: 'Press+Start+2P',
		harloweFamily: `'Press Start 2P', monospace`,
		chapbookFont: 'Press Start 2P/monospace'
	},
	cinzel: {
		label: 'Cinzel',
		googleName: 'Cinzel',
		harloweFamily: `'Cinzel', serif`,
		chapbookFont: 'Cinzel/serif'
	},
	creepster: {
		label: 'Creepster',
		googleName: 'Creepster',
		harloweFamily: `'Creepster', cursive`,
		chapbookFont: 'Creepster/cursive'
	},
	'courier-prime': {
		label: 'Courier Prime',
		googleName: 'Courier+Prime',
		harloweFamily: `'Courier Prime', monospace`,
		chapbookFont: 'Courier Prime/Courier/monospace'
	}
};

export const LAYOUT_FONT_IDS = Object.keys(LAYOUT_FONTS) as LayoutFontId[];

/**
 * Resolves a LayoutTokens.font value to display/CSS info, checking the
 * built-in LAYOUT_FONTS first, then the user's saved custom Google Fonts
 * (prefs.customGoogleFonts, name -> CSS fallback family). Falls back to the
 * default (system) font if fontId matches neither--e.g. a story references a
 * custom font that was since removed from the saved list.
 */
export function resolveFontInfo(
	fontId: string,
	customFonts: Record<string, string>
): LayoutFontInfo {
	const builtIn = LAYOUT_FONTS[fontId as LayoutFontId];

	if (builtIn) {
		return builtIn;
	}

	const fallback = customFonts[fontId];

	if (fallback) {
		const googleName = fontId.replace(/\s+/g, '+');

		return {
			label: fontId,
			googleName,
			harloweFamily: `'${fontId}', ${fallback}`,
			chapbookFont: `${fontId}/${fallback}`
		};
	}

	return LAYOUT_FONTS.default;
}

/**
 * Extracts a Google Font family name from a pasted Google Fonts URL, e.g.
 * "https://fonts.google.com/specimen/Roboto+Slab" (a font's specimen page)
 * or "https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@400;700"
 * (the CSS embed link, which may include a weight/style spec after ':' that
 * this strips). If the input isn't a recognized Google Fonts URL--including
 * a plain typed font name--it's returned trimmed as-is, so typing a name
 * directly keeps working exactly as before.
 */
export function extractGoogleFontName(input: string): string {
	const trimmed = input.trim();

	if (!/^https?:\/\//i.test(trimmed)) {
		return trimmed;
	}

	try {
		const url = new URL(trimmed);
		const specimenMatch = url.pathname.match(/\/specimen\/([^/]+)/);

		if (specimenMatch) {
			return decodeURIComponent(specimenMatch[1].replace(/\+/g, ' '));
		}

		const family = url.searchParams.get('family');

		if (family) {
			return decodeURIComponent(family.split(':')[0].replace(/\+/g, ' '));
		}
	} catch {
		// Not a parseable URL--fall through to returning the trimmed input.
	}

	return trimmed;
}

type PresetDefaults = Omit<
	LayoutTokens,
	'preset' | 'backdropImage' | 'leftPanelImage' | 'passageBackgrounds'
>;

export const LAYOUT_PRESETS: Record<
	LayoutPresetId,
	{label: string; defaults: PresetDefaults}
> = {
	'visual-novel': {
		label: 'Visual Novel',
		defaults: {
			font: 'courier-prime',
			baseFontSize: 16,
			textColor: '#eeeeee',
			backgroundColor: '#000000',
			linkColor: '#66ccff',
			stageMaxWidth: 640,
			dialogueBoxPosition: 'bottom',
			dialogueBoxHeight: 200,
			dialogueBoxPadding: 20,
			dialogueBoxOpacity: 85,
			anchorImageGap: 16,
			leftPanelWidth: 0,
			hideSidebar: false,
			hideDebugger: false,
			alignLeft: false,
			leftGap: 0
		}
	},
	'centered-book': {
		label: 'Centered Book',
		defaults: {
			font: 'cinzel',
			baseFontSize: 18,
			textColor: '#222222',
			backgroundColor: '#f8f5ef',
			linkColor: '#8a5a2a',
			stageMaxWidth: 680,
			dialogueBoxPosition: 'center',
			dialogueBoxHeight: 0,
			dialogueBoxPadding: 32,
			dialogueBoxOpacity: 100,
			anchorImageGap: 16,
			leftPanelWidth: 0,
			hideSidebar: false,
			hideDebugger: false,
			alignLeft: false,
			leftGap: 0
		}
	},
	sidebar: {
		label: 'Sidebar',
		defaults: {
			font: 'default',
			baseFontSize: 16,
			textColor: '#1a1a1a',
			backgroundColor: '#ffffff',
			linkColor: '#1a6fbd',
			stageMaxWidth: 900,
			dialogueBoxPosition: 'top',
			dialogueBoxHeight: 0,
			dialogueBoxPadding: 24,
			dialogueBoxOpacity: 100,
			anchorImageGap: 16,
			leftPanelWidth: 0,
			hideSidebar: false,
			hideDebugger: false,
			alignLeft: false,
			leftGap: 0
		}
	},
	'full-bleed': {
		label: 'Full-Bleed',
		defaults: {
			font: 'default',
			baseFontSize: 20,
			textColor: '#ffffff',
			backgroundColor: '#111111',
			linkColor: '#ffcc00',
			stageMaxWidth: 1200,
			dialogueBoxPosition: 'bottom',
			dialogueBoxHeight: 0,
			dialogueBoxPadding: 40,
			dialogueBoxOpacity: 70,
			anchorImageGap: 16,
			leftPanelWidth: 0,
			hideSidebar: false,
			hideDebugger: false,
			alignLeft: false,
			leftGap: 0
		}
	},
	'character-panel': {
		label: 'Character Panel',
		defaults: {
			font: 'default',
			baseFontSize: 16,
			textColor: '#eeeeee',
			backgroundColor: '#000000',
			linkColor: '#66ccff',
			stageMaxWidth: 640,
			dialogueBoxPosition: 'bottom',
			dialogueBoxHeight: 200,
			dialogueBoxPadding: 20,
			dialogueBoxOpacity: 85,
			anchorImageGap: 16,
			leftPanelWidth: 280,
			hideSidebar: false,
			hideDebugger: false,
			alignLeft: false,
			leftGap: 0
		}
	}
};

export const LAYOUT_PRESET_IDS = Object.keys(
	LAYOUT_PRESETS
) as LayoutPresetId[];

export function defaultLayoutTokens(
	preset: LayoutPresetId = 'visual-novel'
): LayoutTokens {
	return {
		preset,
		backdropImage: '',
		leftPanelImage: '',
		passageBackgrounds: [],
		...LAYOUT_PRESETS[preset].defaults
	};
}

/**
 * Applies a preset's defaults to an existing token set, keeping backdropImage
 * and leftPanelImage (story-specific asset choices a preset switch shouldn't
 * discard).
 */
export function applyPreset(
	tokens: LayoutTokens,
	preset: LayoutPresetId
): LayoutTokens {
	return {...tokens, preset, ...LAYOUT_PRESETS[preset].defaults};
}
