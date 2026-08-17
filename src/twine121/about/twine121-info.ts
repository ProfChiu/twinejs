/**
 * Identity of the Twine121 fork itself, as shown in the startup dialog.
 *
 * This is deliberately separate from `getAppInfo()`, which reports the version
 * in package.json. That number is Twine's--it comes from the upstream project
 * we forked and moves when we merge upstream in. Showing it as "the Twine121
 * version" would be a lie, so Twine121 carries its own version here and shows
 * both.
 *
 * Bump `version` and `lastUpdated` together, by hand, when releasing a build to
 * students.
 */
export const twine121Info = {
	/** Twine121's own version, independent of upstream Twine's. */
	version: '1.0.0',
	/** Release date of that version, ISO 8601 (YYYY-MM-DD). */
	lastUpdated: '2026-08-15',
	/** The upstream Twine release this fork is currently based on. */
	upstreamVersion: '2.12.0',
	/** The project Twine121 forks from. */
	upstreamRepoUrl: 'https://github.com/klembot/twinejs',
	/** Upstream's home page. */
	upstreamHomeUrl: 'https://twinery.org',
	/** Where this fork lives. */
	forkRepoUrl: 'https://github.com/ProfChiu/TWINE121',
	/** SPDX identifier, matching package.json's "license" field and LICENSE. */
	license: 'GPL-3.0'
};

/**
 * Formats an ISO date (YYYY-MM-DD) for display, e.g. "August 15, 2026". Falls
 * back to the raw string if it isn't a date we can parse, so a typo in
 * `twine121Info` degrades to showing the typo rather than "Invalid Date".
 */
export function formatLastUpdated(isoDate: string, locale = 'en-US'): string {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);

	if (!match) {
		return isoDate;
	}

	const [, year, month, day] = match.map(Number);

	// Constructed in local time (not `new Date(isoDate)`, which parses as UTC and
	// can display the previous day west of Greenwich).
	const date = new Date(year, month - 1, day);

	// Out-of-range parts (month 13, day 45) silently roll over into a real date,
	// so check that what we got back is what we asked for.
	if (
		date.getFullYear() !== year ||
		date.getMonth() !== month - 1 ||
		date.getDate() !== day
	) {
		return isoDate;
	}

	return date.toLocaleDateString(locale, {
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	});
}
