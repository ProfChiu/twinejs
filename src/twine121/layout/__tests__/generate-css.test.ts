import {
	MANAGED_CHAPBOOK_KEYS,
	MANAGED_CSS_BEGIN,
	MANAGED_CSS_END,
	generateChapbookVarsLines,
	generateHarloweCss,
	hexToRgba,
	mergeChapbookVars,
	mergeManagedStylesheet
} from '../generate-css';
import {defaultLayoutTokens} from '../layout-tokens';

describe('hexToRgba', () => {
	it('converts a 6-digit hex color', () => {
		expect(hexToRgba('#000000', 0.5)).toBe('rgba(0, 0, 0, 0.5)');
		expect(hexToRgba('#ffffff', 1)).toBe('rgba(255, 255, 255, 1)');
	});

	it('converts a 3-digit hex color', () => {
		expect(hexToRgba('#fff', 0.5)).toBe('rgba(255, 255, 255, 0.5)');
	});

	it('works without a leading #', () => {
		expect(hexToRgba('000000', 0.5)).toBe('rgba(0, 0, 0, 0.5)');
	});
});

describe('generateHarloweCss', () => {
	it('includes an @import as the very first line when a Google font is set', () => {
		const css = generateHarloweCss(defaultLayoutTokens('visual-novel'), {});
		const firstLine = css.split('\n')[0];

		expect(firstLine).toBe(
			`@import url('https://fonts.googleapis.com/css2?family=Courier+Prime&display=swap');`
		);
	});

	it('omits the @import and font-family override for the default font', () => {
		const css = generateHarloweCss(
			{
				...defaultLayoutTokens('sidebar'),
				font: 'default'
			},
			{}
		);

		expect(css).not.toContain('@import');
		expect(css).not.toContain('font-family');
	});

	it('applies background/text color and font size to tw-story', () => {
		const css = generateHarloweCss(
			{
				...defaultLayoutTokens('visual-novel'),
				backgroundColor: '#010203',
				textColor: '#fefdfc',
				baseFontSize: 22
			},
			{}
		);

		expect(css).toContain('background-color: #010203;');
		expect(css).toContain('color: #fefdfc;');
		expect(css).toContain('font-size: 22px;');
	});

	it('applies link color to both tw-story and tw-passage links', () => {
		const css = generateHarloweCss(
			{
				...defaultLayoutTokens('visual-novel'),
				linkColor: '#ff00ff'
			},
			{}
		);

		expect(css).toContain('tw-story a, tw-passage a {');
		expect(css).toContain('color: #ff00ff;');
	});

	it('applies stage max-width and padding to tw-passage', () => {
		const css = generateHarloweCss(
			{
				...defaultLayoutTokens('visual-novel'),
				stageMaxWidth: 555,
				dialogueBoxPadding: 12
			},
			{}
		);

		expect(css).toContain('max-width: 555px;');
		expect(css).toContain('padding: 12px;');
	});

	it('centers tw-passage by default (alignLeft is false)', () => {
		const css = generateHarloweCss(
			{
				...defaultLayoutTokens('visual-novel'),
				alignLeft: false
			},
			{}
		);

		expect(css).toContain('margin: 0 auto;');
		expect(css).not.toContain('margin: 0 auto 0 0;');
	});

	it('aligns tw-passage flush left (gap 0) and zeroes the tw-story gutter when alignLeft is true', () => {
		const css = generateHarloweCss(
			{
				...defaultLayoutTokens('visual-novel'),
				alignLeft: true,
				leftGap: 0
			},
			{}
		);

		expect(css).toContain('margin: 0 auto 0 0px;');
		expect(css).toContain('padding-left: 0;');
		expect(css).not.toContain('margin: 0 auto;');
	});

	it('offsets tw-passage by the left gap when alignLeft is true', () => {
		const css = generateHarloweCss(
			{
				...defaultLayoutTokens('visual-novel'),
				alignLeft: true,
				leftGap: 40
			},
			{}
		);

		expect(css).toContain('margin: 0 auto 0 40px;');
	});

	it('does not zero the tw-story gutter for the left gap when a left panel is reserved', () => {
		const css = generateHarloweCss(
			{
				...defaultLayoutTokens('visual-novel'),
				alignLeft: true,
				leftGap: 20,
				leftPanelWidth: 280
			},
			{}
		);

		// The panel sets its own padding-left; the gap is added on top via margin.
		expect(css).toContain('padding-left: 280px;');
		expect(css).toContain('margin: 0 auto 0 20px;');
	});

	it('emits a per-tag background rule with a legibility scrim for each passage background', () => {
		const css = generateHarloweCss(
			{
				...defaultLayoutTokens('visual-novel'),
				backgroundColor: '#000000',
				passageBackgrounds: [
					{tag: 'cave', image: 'images/cave.png'},
					{tag: 'market', image: 'images/market.jpg'}
				]
			},
			{}
		);

		expect(css).toContain('tw-passage[tags~="cave"] {');
		expect(css).toContain(
			"background-image: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('images/cave.png');"
		);
		expect(css).toContain('tw-passage[tags~="market"] {');
		expect(css).toContain("url('images/market.jpg')");
	});

	it('skips passage-background rows missing a tag or an image', () => {
		const css = generateHarloweCss(
			{
				...defaultLayoutTokens('visual-novel'),
				passageBackgrounds: [
					{tag: '', image: 'images/x.png'},
					{tag: 'nope', image: ''},
					{tag: '  ', image: 'images/y.png'}
				]
			},
			{}
		);

		expect(css).not.toContain('tags~=');
	});

	it('omits min-height when dialogueBoxHeight is 0 (auto)', () => {
		const css = generateHarloweCss(
			{
				...defaultLayoutTokens('visual-novel'),
				dialogueBoxHeight: 0
			},
			{}
		);

		expect(css).not.toContain('min-height');
	});

	it('sets min-height when dialogueBoxHeight is set', () => {
		const css = generateHarloweCss(
			{
				...defaultLayoutTokens('visual-novel'),
				dialogueBoxHeight: 240
			},
			{}
		);

		expect(css).toContain('min-height: 240px;');
	});

	it('sets justify-content to match dialogue box position', () => {
		expect(
			generateHarloweCss(
				{
					...defaultLayoutTokens('visual-novel'),
					dialogueBoxPosition: 'top'
				},
				{}
			)
		).toContain('justify-content: flex-start;');
		expect(
			generateHarloweCss(
				{
					...defaultLayoutTokens('visual-novel'),
					dialogueBoxPosition: 'center'
				},
				{}
			)
		).toContain('justify-content: center;');
		expect(
			generateHarloweCss(
				{
					...defaultLayoutTokens('visual-novel'),
					dialogueBoxPosition: 'bottom'
				},
				{}
			)
		).toContain('justify-content: flex-end;');
	});

	it('omits a background-color on tw-passage when opacity is 100', () => {
		const css = generateHarloweCss(
			{
				...defaultLayoutTokens('centered-book'),
				dialogueBoxOpacity: 100
			},
			{}
		);
		const passageBlock = css.slice(css.indexOf('tw-passage {'));

		expect(passageBlock).not.toContain('background-color');
	});

	it('adds a semi-transparent rgba background-color on tw-passage when opacity is under 100', () => {
		const css = generateHarloweCss(
			{
				...defaultLayoutTokens('visual-novel'),
				backgroundColor: '#000000',
				dialogueBoxOpacity: 50
			},
			{}
		);

		expect(css).toContain('rgba(0, 0, 0, 0.5);');
	});

	it('adds a backdrop image when one is set', () => {
		const css = generateHarloweCss(
			{
				...defaultLayoutTokens('visual-novel'),
				backdropImage: 'images/bg.png'
			},
			{}
		);

		expect(css).toContain(`background-image: url('images/bg.png');`);
		expect(css).toContain('background-size: cover;');
	});

	it('omits backdrop image rules when none is set', () => {
		const css = generateHarloweCss(
			{
				...defaultLayoutTokens('visual-novel'),
				backdropImage: ''
			},
			{}
		);

		expect(css).not.toContain('background-image');
	});

	it('styles any per-passage anchor image (class="scene") with a bottom margin equal to anchorImageGap', () => {
		const css = generateHarloweCss(
			{
				...defaultLayoutTokens('visual-novel'),
				anchorImageGap: 42
			},
			{}
		);

		expect(css).toContain('tw-passage img.scene {');
		expect(css).toContain('margin: 0 auto 42px;');
	});

	it('constrains the anchor image to the passage width and centers it', () => {
		const css = generateHarloweCss(defaultLayoutTokens('visual-novel'), {});
		const sceneBlock = css.slice(css.indexOf('tw-passage img.scene {'));

		expect(sceneBlock).toContain('max-width: 100%;');
		expect(sceneBlock).toContain('display: block;');
	});

	it('always emits the anchor image rule, regardless of preset', () => {
		for (const preset of [
			'visual-novel',
			'centered-book',
			'sidebar',
			'full-bleed'
		] as const) {
			expect(generateHarloweCss(defaultLayoutTokens(preset), {})).toContain(
				'tw-passage img.scene {'
			);
		}
	});

	it('omits left panel CSS when leftPanelWidth is 0', () => {
		const css = generateHarloweCss(
			{...defaultLayoutTokens('visual-novel'), leftPanelWidth: 0},
			{}
		);

		expect(css).not.toContain('padding-left');
		expect(css).not.toContain('tw-story::before');
	});

	it('adds a left panel reserving space and a neutral placeholder background when set', () => {
		const css = generateHarloweCss(
			{
				...defaultLayoutTokens('visual-novel'),
				leftPanelWidth: 280,
				leftPanelImage: ''
			},
			{}
		);

		expect(css).toContain('padding-left: 280px;');
		expect(css).toContain('tw-story::before {');
		expect(css).toContain('width: 280px;');
		expect(css).not.toContain('background-image');
	});

	it('uses the chosen left panel image when set', () => {
		const css = generateHarloweCss(
			{
				...defaultLayoutTokens('visual-novel'),
				leftPanelWidth: 280,
				leftPanelImage: 'images/portrait.png'
			},
			{}
		);

		expect(css).toContain(`background-image: url('images/portrait.png');`);
	});

	it('resolves a saved custom Google Font by name', () => {
		const css = generateHarloweCss(
			{...defaultLayoutTokens('visual-novel'), font: 'Roboto Slab'},
			{'Roboto Slab': 'serif'}
		);

		expect(css).toContain(
			`@import url('https://fonts.googleapis.com/css2?family=Roboto+Slab&display=swap');`
		);
		expect(css).toContain(`font-family: 'Roboto Slab', serif;`);
	});

	it('falls back to the default font when the font id matches neither a built-in nor a saved custom font', () => {
		const css = generateHarloweCss(
			{...defaultLayoutTokens('visual-novel'), font: 'not-a-real-font'},
			{}
		);

		expect(css).not.toContain('@import');
		expect(css).not.toContain('font-family');
	});

	it('omits sidebar/debugger rules when both toggles are off', () => {
		const css = generateHarloweCss(
			{
				...defaultLayoutTokens('visual-novel'),
				hideSidebar: false,
				hideDebugger: false
			},
			{}
		);

		expect(css).not.toContain('tw-sidebar');
		expect(css).not.toContain('tw-debugger');
	});

	it('hides tw-sidebar when hideSidebar is on', () => {
		const css = generateHarloweCss(
			{...defaultLayoutTokens('visual-novel'), hideSidebar: true},
			{}
		);

		expect(css).toContain('tw-sidebar { display: none !important; }');
	});

	it('hides tw-debugger when hideDebugger is on', () => {
		const css = generateHarloweCss(
			{...defaultLayoutTokens('visual-novel'), hideDebugger: true},
			{}
		);

		expect(css).toContain('tw-debugger { display: none !important; }');
	});
});

describe('mergeManagedStylesheet', () => {
	it('produces a stylesheet containing just the managed block when starting empty', () => {
		const result = mergeManagedStylesheet('', defaultLayoutTokens(), {});

		expect(result.startsWith(MANAGED_CSS_BEGIN)).toBe(true);
		expect(result).toContain(MANAGED_CSS_END);
	});

	it('places the managed block before any hand-written CSS', () => {
		const handWritten = 'tw-passage.custom { color: red; }';
		const result = mergeManagedStylesheet(
			handWritten,
			defaultLayoutTokens(),
			{}
		);

		expect(result.indexOf(MANAGED_CSS_BEGIN)).toBeLessThan(
			result.indexOf(handWritten)
		);
	});

	it('preserves hand-written CSS verbatim', () => {
		const handWritten = 'tw-passage.custom {\n  color: red;\n}';
		const result = mergeManagedStylesheet(
			handWritten,
			defaultLayoutTokens(),
			{}
		);

		expect(result).toContain(handWritten);
	});

	it('replaces a previously-generated managed block instead of duplicating it', () => {
		const first = mergeManagedStylesheet(
			'',
			defaultLayoutTokens('visual-novel'),
			{}
		);
		const second = mergeManagedStylesheet(
			first,
			defaultLayoutTokens('centered-book'),
			{}
		);
		const beginCount = second.split(MANAGED_CSS_BEGIN).length - 1;

		expect(beginCount).toBe(1);
		expect(second).toContain('#f8f5ef'); // centered-book background
		expect(second).not.toContain('#000000'); // visual-novel background gone
	});

	it('preserves hand-written CSS across a regeneration', () => {
		const handWritten = 'tw-passage.custom { color: red; }';
		const first = mergeManagedStylesheet(
			handWritten,
			defaultLayoutTokens('visual-novel'),
			{}
		);
		const second = mergeManagedStylesheet(
			first,
			defaultLayoutTokens('centered-book'),
			{}
		);

		expect(second).toContain(handWritten);
	});
});

describe('generateChapbookVarsLines', () => {
	it('sets page color combining text and background', () => {
		const lines = generateChapbookVarsLines(
			{
				...defaultLayoutTokens('visual-novel'),
				textColor: '#eeeeee',
				backgroundColor: '#000000'
			},
			{}
		);

		expect(lines).toContain(`config.style.page.color: '#eeeeee on #000000'`);
	});

	it('sets backdrop to the background color', () => {
		const lines = generateChapbookVarsLines(
			{
				...defaultLayoutTokens('visual-novel'),
				backgroundColor: '#123456'
			},
			{}
		);

		expect(lines).toContain(`config.style.backdrop: '#123456'`);
	});

	it('sets verticalAlign to match dialogue box position', () => {
		const lines = generateChapbookVarsLines(
			{
				...defaultLayoutTokens('visual-novel'),
				dialogueBoxPosition: 'top'
			},
			{}
		);

		expect(lines).toContain(`config.style.page.verticalAlign: 'top'`);
	});

	it('sets link color', () => {
		const lines = generateChapbookVarsLines(
			{
				...defaultLayoutTokens('visual-novel'),
				linkColor: '#ff00ff'
			},
			{}
		);

		expect(lines).toContain(`config.style.page.link.color: '#ff00ff'`);
	});

	it('includes googleFont and page.font for a Google font using the verified name/fallback/size pattern', () => {
		const lines = generateChapbookVarsLines(
			{
				...defaultLayoutTokens('visual-novel'),
				font: 'courier-prime',
				baseFontSize: 16
			},
			{}
		);

		expect(lines).toContain(
			`config.style.googleFont: '<link href="https://fonts.googleapis.com/css2?family=Courier+Prime&display=swap" rel="stylesheet">'`
		);
		expect(lines).toContain(
			`config.style.page.font: 'Courier Prime/Courier/monospace 16'`
		);
	});

	it('omits googleFont and page.font for the default font', () => {
		const lines = generateChapbookVarsLines(
			{
				...defaultLayoutTokens('sidebar'),
				font: 'default'
			},
			{}
		);

		expect(lines.some(line => line.startsWith('config.style.googleFont'))).toBe(
			false
		);
		expect(lines.some(line => line.startsWith('config.style.page.font'))).toBe(
			false
		);
	});

	it('only emits keys from the managed key list', () => {
		const lines = generateChapbookVarsLines(
			defaultLayoutTokens('visual-novel'),
			{}
		);

		for (const line of lines) {
			const key = line.slice(0, line.indexOf(':'));

			expect(MANAGED_CHAPBOOK_KEYS).toContain(key);
		}
	});
});

describe('mergeChapbookVars', () => {
	it('creates a vars section when the passage has none yet', () => {
		const result = mergeChapbookVars('Once upon a time...', [
			`config.style.backdrop: '#000000'`
		]);

		expect(result).toBe(
			`config.style.backdrop: '#000000'\n--\nOnce upon a time...`
		);
	});

	it('creates a vars section for an empty passage', () => {
		const result = mergeChapbookVars('', [`config.style.backdrop: '#000000'`]);

		expect(result).toBe(`config.style.backdrop: '#000000'\n--\n`);
	});

	it('replaces only managed keys, keeping hand-written vars', () => {
		const existing = [
			`gold: 0`,
			`config.footer.left: "{back link, label: 'BACK'}"`,
			`config.style.backdrop: '#111111'`,
			`--`,
			`Story text here.`
		].join('\n');
		const result = mergeChapbookVars(existing, [
			`config.style.backdrop: '#222222'`
		]);

		expect(result).toContain('gold: 0');
		expect(result).toContain(
			`config.footer.left: "{back link, label: 'BACK'}"`
		);
		expect(result).toContain(`config.style.backdrop: '#222222'`);
		expect(result).not.toContain(`config.style.backdrop: '#111111'`);
		expect(result).toContain('Story text here.');
	});

	it('preserves story text unchanged, including further -- occurrences', () => {
		const existing = [
			`config.style.backdrop: '#111111'`,
			`--`,
			`A line with -- in the middle of it.`
		].join('\n');
		const result = mergeChapbookVars(existing, [
			`config.style.backdrop: '#222222'`
		]);

		expect(result).toContain('A line with -- in the middle of it.');
	});

	it('only replaces the exact managed key, not a similarly-prefixed one', () => {
		const existing = [
			`config.style.page.footer.font: '14 small caps'`,
			`--`,
			`Text.`
		].join('\n');
		const result = mergeChapbookVars(existing, [
			`config.style.page.font: 'Cinzel/serif 18'`
		]);

		expect(result).toContain(`config.style.page.footer.font: '14 small caps'`);
		expect(result).toContain(`config.style.page.font: 'Cinzel/serif 18'`);
	});
});
