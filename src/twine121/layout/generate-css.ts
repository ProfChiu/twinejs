import {LayoutTokens, resolveFontInfo} from './layout-tokens';

export const MANAGED_CSS_BEGIN =
	'/* === Twine121 layout: begin (managed -- edit tokens in the designer) === */';
export const MANAGED_CSS_END = '/* === Twine121 layout: end === */';

const JUSTIFY_BY_POSITION = {
	top: 'flex-start',
	center: 'center',
	bottom: 'flex-end'
} as const;

export function hexToRgba(hex: string, alpha: number): string {
	const clean = hex.replace('#', '');
	const full =
		clean.length === 3
			? clean
					.split('')
					.map(c => c + c)
					.join('')
			: clean;
	const r = parseInt(full.slice(0, 2), 16) || 0;
	const g = parseInt(full.slice(2, 4), 16) || 0;
	const b = parseInt(full.slice(4, 6), 16) || 0;

	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Generates the CSS Twine121 manages for a Harlowe story's Story Stylesheet.
 * Selectors (tw-story, tw-passage) and the @import-must-come-first rule are
 * verified against LearnTwine's Google Fonts and Visual Novel Look chapters,
 * not guessed from documentation.
 */
export function generateHarloweCss(
	tokens: LayoutTokens,
	customFonts: Record<string, string>
): string {
	const font = resolveFontInfo(tokens.font, customFonts);
	const lines: string[] = [];

	if (font.googleName) {
		lines.push(
			`@import url('https://fonts.googleapis.com/css2?family=${font.googleName}&display=swap');`
		);
		lines.push('');
	}

	lines.push('tw-story {');
	lines.push(`  background-color: ${tokens.backgroundColor};`);
	lines.push(`  color: ${tokens.textColor};`);
	if (font.googleName) {
		lines.push(`  font-family: ${font.harloweFamily};`);
	}
	lines.push(`  font-size: ${tokens.baseFontSize}px;`);
	lines.push('  display: flex;');
	lines.push('  flex-direction: column;');
	lines.push(
		`  justify-content: ${JUSTIFY_BY_POSITION[tokens.dialogueBoxPosition]};`
	);
	// When left-aligned with no reserved left panel, zero Harlowe's default
	// tw-story gutter so a Left Gap of 0 really sits flush against the window
	// edge. (A left panel, handled below, sets its own padding-left instead.)
	if (tokens.alignLeft && tokens.leftPanelWidth === 0) {
		lines.push('  padding-left: 0;');
	}
	if (tokens.backdropImage) {
		lines.push(`  background-image: url('${tokens.backdropImage}');`);
		lines.push('  background-size: cover;');
		lines.push('  background-position: center;');
	}
	lines.push('}');

	lines.push('tw-story a, tw-passage a {');
	lines.push(`  color: ${tokens.linkColor};`);
	lines.push('}');

	lines.push('tw-passage {');
	lines.push(`  max-width: ${tokens.stageMaxWidth}px;`);
	lines.push('  width: 100%;');
	lines.push(
		`  margin: ${
			tokens.alignLeft ? `0 auto 0 ${tokens.leftGap}px` : '0 auto'
		};`
	);
	lines.push('  box-sizing: border-box;');
	lines.push(`  padding: ${tokens.dialogueBoxPadding}px;`);
	if (tokens.dialogueBoxHeight > 0) {
		lines.push(`  min-height: ${tokens.dialogueBoxHeight}px;`);
	}
	if (tokens.dialogueBoxOpacity < 100) {
		lines.push(
			`  background-color: ${hexToRgba(
				tokens.backgroundColor,
				tokens.dialogueBoxOpacity / 100
			)};`
		);
	}
	lines.push('}');

	// Per-passage anchor image--any image the student tags class="scene" (the
	// convention LearnTwine Ch. 7 already teaches). Sizing/centering is a
	// fixed, sane baseline so the feature works without a frame/border token
	// nobody asked for; the gap is the one thing that's actually tunable.
	lines.push('tw-passage img.scene {');
	lines.push('  display: block;');
	lines.push('  max-width: 100%;');
	lines.push(`  margin: 0 auto ${tokens.anchorImageGap}px;`);
	lines.push('}');

	// Per-tag passage backgrounds. Harlowe puts a passage's tags on its
	// <tw-passage> element as a space-separated `tags` attribute, so
	// [tags~="cave"] targets every passage tagged "cave". A backgroundColor
	// scrim is layered over the photo (a gradient of a single color counts as an
	// image, so it stacks above url()) to keep the passage text legible.
	(tokens.passageBackgrounds ?? []).forEach(bg => {
		const tag = bg.tag.trim();

		if (!tag || !bg.image) {
			return;
		}

		const scrim = hexToRgba(tokens.backgroundColor, 0.5);

		lines.push(`tw-passage[tags~="${tag}"] {`);
		lines.push(
			`  background-image: linear-gradient(${scrim}, ${scrim}), url('${bg.image}');`
		);
		lines.push('  background-size: cover;');
		lines.push('  background-position: center;');
		lines.push('}');
	});

	// A reserved left-side panel (e.g. for a character portrait), added via
	// ::before + padding-left rather than restructuring tw-story's own
	// flex-direction--which dialogueBoxPosition above already depends on--so
	// this is fully additive and works alongside any vertical position.
	if (tokens.leftPanelWidth > 0) {
		lines.push('tw-story {');
		lines.push('  position: relative;');
		lines.push(`  padding-left: ${tokens.leftPanelWidth}px;`);
		lines.push('}');

		lines.push('tw-story::before {');
		lines.push(`  content: '';`);
		lines.push('  position: fixed;');
		lines.push('  top: 0;');
		lines.push('  left: 0;');
		lines.push('  bottom: 0;');
		lines.push(`  width: ${tokens.leftPanelWidth}px;`);
		lines.push('  background-color: #333333;');
		if (tokens.leftPanelImage) {
			lines.push(`  background-image: url('${tokens.leftPanelImage}');`);
			lines.push('  background-size: cover;');
			lines.push('  background-position: center;');
		}
		lines.push('}');
	}

	// Harlowe's own chrome--the undo/redo/restart sidebar and the variable
	// inspector debug panel (only present when tested with formatOptions:
	// 'debug'; see useStoryLaunch's testStory). !important guards against
	// Harlowe's bundled CSS, whose cascade position relative to this managed
	// block isn't guaranteed.
	if (tokens.hideSidebar) {
		lines.push('tw-sidebar { display: none !important; }');
	}

	if (tokens.hideDebugger) {
		lines.push('tw-debugger { display: none !important; }');
	}

	return lines.join('\n');
}

function removeManagedCssBlock(existing: string): string {
	const beginIndex = existing.indexOf(MANAGED_CSS_BEGIN);

	if (beginIndex === -1) {
		return existing.trim();
	}

	const endIndex = existing.indexOf(MANAGED_CSS_END, beginIndex);

	if (endIndex === -1) {
		// Malformed (e.g. hand-edited)--leave everything alone rather than guess
		// where the block was meant to end.
		return existing.trim();
	}

	const before = existing.slice(0, beginIndex).trim();
	const after = existing.slice(endIndex + MANAGED_CSS_END.length).trim();

	return [before, after].filter(Boolean).join('\n\n');
}

/**
 * Merges generated layout CSS into a Story Stylesheet, replacing only the
 * previously-managed block (if any) and leaving hand-written CSS elsewhere
 * untouched. The managed block always goes at the very top of the file--CSS
 * requires @import rules to precede every other rule, and this is the only
 * placement that guarantees that regardless of what hand-written CSS exists.
 */
export function mergeManagedStylesheet(
	existingStylesheet: string,
	tokens: LayoutTokens,
	customFonts: Record<string, string>
): string {
	const rest = removeManagedCssBlock(existingStylesheet);
	const block = `${MANAGED_CSS_BEGIN}\n${generateHarloweCss(
		tokens,
		customFonts
	)}\n${MANAGED_CSS_END}`;

	return rest ? `${block}\n\n${rest}` : `${block}\n`;
}

/**
 * Chapbook config keys Twine121 manages in a story's start passage vars
 * section. Exact set verified against LearnTwine's Google Fonts and Visual
 * Novel Look chapters--do not add a key here without a verified source.
 */
export const MANAGED_CHAPBOOK_KEYS = [
	'config.style.googleFont',
	'config.style.page.font',
	'config.style.page.color',
	'config.style.backdrop',
	'config.style.page.verticalAlign',
	'config.style.page.link.color'
];

/**
 * Generates the config.style.* vars-section lines Twine121 manages for a
 * Chapbook story. Chapbook has no verified equivalent for stage max-width,
 * dialogue box height/padding/opacity, or an image backdrop (config.style.
 * backdrop only accepts a color--see LearnTwine Ch. 2)--those tokens simply
 * have no effect here, which the designer UI surfaces rather than hides.
 */
export function generateChapbookVarsLines(
	tokens: LayoutTokens,
	customFonts: Record<string, string>
): string[] {
	const font = resolveFontInfo(tokens.font, customFonts);
	const lines: string[] = [];

	if (font.googleName && font.chapbookFont) {
		lines.push(
			`config.style.googleFont: '<link href="https://fonts.googleapis.com/css2?family=${font.googleName}&display=swap" rel="stylesheet">'`
		);
		lines.push(
			`config.style.page.font: '${font.chapbookFont} ${tokens.baseFontSize}'`
		);
	}

	lines.push(
		`config.style.page.color: '${tokens.textColor} on ${tokens.backgroundColor}'`
	);
	lines.push(`config.style.backdrop: '${tokens.backgroundColor}'`);
	lines.push(
		`config.style.page.verticalAlign: '${tokens.dialogueBoxPosition}'`
	);
	lines.push(`config.style.page.link.color: '${tokens.linkColor}'`);

	return lines;
}

/**
 * Merges generated config lines into a passage's vars section (the area
 * above a line that is exactly "--", per Chapbook's format), replacing only
 * lines whose key Twine121 manages and leaving everything else--other vars,
 * story text--untouched. If the passage has no vars section yet, one is
 * created.
 */
export function mergeChapbookVars(
	passageText: string,
	newLines: string[]
): string {
	const lines = passageText.split('\n');
	const sepIndex = lines.findIndex(line => line.trim() === '--');
	const varsLines = sepIndex === -1 ? [] : lines.slice(0, sepIndex);
	const storyLines = sepIndex === -1 ? lines : lines.slice(sepIndex + 1);
	const managedKeys = new Set(MANAGED_CHAPBOOK_KEYS);
	const keptVarsLines = varsLines.filter(line => {
		const key = line.slice(0, line.indexOf(':')).trim();

		return !managedKeys.has(key);
	});

	return [...keptVarsLines, ...newLines, '--', ...storyLines].join('\n');
}
