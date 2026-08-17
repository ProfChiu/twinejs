import {license as packageLicense} from '../../../../package.json';
import {formatLastUpdated, twine121Info} from '../twine121-info';

describe('twine121Info', () => {
	it('carries a version distinct from the upstream Twine version', () => {
		// The point of this module: package.json's version belongs to upstream
		// Twine. If these ever collapse into the same field, the startup dialog
		// starts lying about what it is.
		expect(twine121Info.version).not.toBe(twine121Info.upstreamVersion);
	});

	it('has an ISO-formatted last updated date', () => {
		expect(twine121Info.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});

	it('links to the upstream repo', () => {
		expect(twine121Info.upstreamRepoUrl).toBe(
			'https://github.com/klembot/twinejs'
		);
	});

	it('matches the license declared in package.json', () => {
		expect(twine121Info.license).toBe(packageLicense);
	});
});

describe('formatLastUpdated()', () => {
	it('formats an ISO date as a readable one', () => {
		expect(formatLastUpdated('2026-08-15')).toBe('August 15, 2026');
	});

	it('does not shift the date across time zones', () => {
		// `new Date('2026-01-01')` parses as UTC and renders as Dec 31 in the
		// Americas--this must not do that.
		expect(formatLastUpdated('2026-01-01')).toBe('January 1, 2026');
	});

	it('returns the raw value if it is not a parseable date', () => {
		expect(formatLastUpdated('sometime soon')).toBe('sometime soon');
		expect(formatLastUpdated('2026-13-45')).toBe('2026-13-45');
	});
});
