import {extractGoogleFontName} from '../layout-tokens';

describe('extractGoogleFontName', () => {
	it('extracts the name from a Google Fonts specimen page URL', () => {
		expect(
			extractGoogleFontName('https://fonts.google.com/specimen/Roboto+Slab')
		).toBe('Roboto Slab');
	});

	it('extracts the name from a Google Fonts specimen page URL with a trailing path segment', () => {
		expect(
			extractGoogleFontName(
				'https://fonts.google.com/specimen/Playfair+Display?query=Playfair'
			)
		).toBe('Playfair Display');
	});

	it('extracts the name from a css2 embed URL, stripping a weight/style spec', () => {
		expect(
			extractGoogleFontName(
				'https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@400;700&display=swap'
			)
		).toBe('Roboto Slab');
	});

	it('extracts the name from a legacy css embed URL', () => {
		expect(
			extractGoogleFontName('https://fonts.googleapis.com/css?family=Open+Sans')
		).toBe('Open Sans');
	});

	it('decodes percent-encoded spaces', () => {
		expect(
			extractGoogleFontName(
				'https://fonts.googleapis.com/css2?family=IBM%20Plex%20Mono'
			)
		).toBe('IBM Plex Mono');
	});

	it('returns a plain typed name unchanged', () => {
		expect(extractGoogleFontName('Roboto Slab')).toBe('Roboto Slab');
	});

	it('trims whitespace from a plain typed name', () => {
		expect(extractGoogleFontName('  Roboto Slab  ')).toBe('Roboto Slab');
	});

	it('falls back to the trimmed input for a URL with no recognizable font info', () => {
		expect(extractGoogleFontName('https://example.com/not-a-font-url')).toBe(
			'https://example.com/not-a-font-url'
		);
	});

	it('falls back to the trimmed input for a malformed URL', () => {
		expect(extractGoogleFontName('https://')).toBe('https://');
	});
});
