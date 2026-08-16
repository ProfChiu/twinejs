import {HOWLER_SOURCE} from './howler-source';

export const MANAGED_SOUND_BEGIN =
	'/* === Twine121 sound: begin (managed -- added by the Add Sound button) === */';
export const MANAGED_SOUND_END = '/* === Twine121 sound: end === */';

// The author-facing SFX API, inlined into a story's Story JavaScript alongside
// Howler. Thin wrapper over Howler: named sounds with play/stop/stopAll/volume
// and loop/volume/stopAfter options. Deliberately ES5-ish and dependency-free
// so it runs verbatim both in Harlowe (which eval()s Story JavaScript) and
// Chapbook (which runs it via new Function), with no build step in the story.
const SFX_WRAPPER = `window.SFX = (function () {
	var reg = {};
	var pendingUnlock = {};
	var unlocked = false;

	// Each sound's Howl is created EAGERLY in define() so preload:true actually
	// loads the file at story start. html5:true forces HTML5-Audio (media
	// element) playback: Web Audio loads via XHR, which is blocked on the file://
	// URL a Test/Play preview opens as, whereas a media element loads a relative
	// file:// path fine -- the same reason a plain <audio> tag works. Verified
	// live in a real browser over file://.
	function get(name) {
		var howl = reg[name];
		if (!howl && window.console) {
			console.warn('SFX: sound "' + name + '" is not defined');
		}
		return howl || null;
	}

	function doPlay(name, opts) {
		var howl = get(name);
		if (!howl) {
			return;
		}
		howl.loop(!!opts.loop);
		if (typeof opts.volume === 'number') {
			howl.volume(opts.volume);
		}
		var id = howl.play();
		if (opts.stopAfter) {
			setTimeout(function () {
				howl.stop(id);
			}, opts.stopAfter * 1000);
		}
		return id;
	}

	// Browsers block audio until the player interacts with the page. Any sound
	// requested before that first click/tap/key is remembered here and started on
	// the first interaction; after that, user activation persists for the page so
	// plays happen immediately. We deliberately DON'T rely on Howler's playerror
	// event to decide what to replay (it races Howler's internal load queue,
	// especially for large files) -- we just replay whatever was requested,
	// stopping first so a track can't double up. Verified live over file://.
	function onFirstGesture() {
		if (unlocked) {
			return;
		}
		unlocked = true;
		removeGestureListeners();
		var queued = pendingUnlock;
		pendingUnlock = {};
		Object.keys(queued).forEach(function (name) {
			var howl = get(name);
			if (howl) {
				howl.stop();
			}
			doPlay(name, queued[name]);
		});
	}

	function addGestureListeners() {
		if (typeof document === 'undefined') {
			return;
		}
		document.addEventListener('click', onFirstGesture, true);
		document.addEventListener('touchstart', onFirstGesture, true);
		document.addEventListener('keydown', onFirstGesture, true);
	}

	function removeGestureListeners() {
		if (typeof document === 'undefined') {
			return;
		}
		document.removeEventListener('click', onFirstGesture, true);
		document.removeEventListener('touchstart', onFirstGesture, true);
		document.removeEventListener('keydown', onFirstGesture, true);
	}

	addGestureListeners();

	return {
		define: function (name, url) {
			if (!reg[name]) {
				reg[name] = new Howl({src: [url], preload: true, html5: true});
			}
		},
		play: function (name, opts) {
			opts = opts || {};
			if (!unlocked) {
				pendingUnlock[name] = opts;
			}
			return doPlay(name, opts);
		},
		stop: function (name) {
			delete pendingUnlock[name];
			var howl = get(name);
			if (howl) {
				howl.stop();
			}
		},
		stopAll: function () {
			pendingUnlock = {};
			if (window.Howler) {
				window.Howler.stop();
			}
		},
		volume: function (target, v) {
			if (target === 'master') {
				if (window.Howler) {
					window.Howler.volume(v);
				}
			} else {
				var howl = get(target);
				if (howl) {
					howl.volume(v);
				}
			}
		}
	};
})();`;

// Chapbook-only custom inserts, registered behind a typeof-engine guard so this
// exact block is also harmless in Harlowe (where `engine` doesn't exist and the
// block is reached only via the passage <script> path). Lets Chapbook authors
// write {play sound: 'x', volume: 0.5} / {stop sound: 'x'}. Verified against the
// Chapbook guide's custom-insert API: engine.extend() + engine.template.inserts
// .add({match, render}); match must be two words; render returns a string.
const CHAPBOOK_INSERTS = `if (typeof engine !== 'undefined' && engine.extend) {
	engine.extend('2.0.0', function () {
		engine.template.inserts.add({
			match: /^play sound/i,
			render: function (firstArg, props) {
				window.SFX.play(firstArg, props || {});
				return '';
			}
		});
		engine.template.inserts.add({
			match: /^stop sound/i,
			render: function (firstArg) {
				window.SFX.stop(firstArg);
				return '';
			}
		});
	});
}`;

/**
 * Strips the previously-managed sound block (if any), leaving hand-written
 * Story JavaScript elsewhere untouched. Mirrors the layout designer's managed
 * CSS-block handling.
 */
export function removeManagedSoundBlock(existing: string): string {
	const beginIndex = existing.indexOf(MANAGED_SOUND_BEGIN);

	if (beginIndex === -1) {
		return existing.trim();
	}

	const endIndex = existing.indexOf(MANAGED_SOUND_END, beginIndex);

	if (endIndex === -1) {
		// Malformed (e.g. hand-edited)--leave everything alone rather than guess
		// where the block was meant to end.
		return existing.trim();
	}

	const before = existing.slice(0, beginIndex).trim();
	const after = existing.slice(endIndex + MANAGED_SOUND_END.length).trim();

	return [before, after].filter(Boolean).join('\n\n');
}

/**
 * Reads the name -> relativePath registry back out of an existing managed block
 * by scanning its SFX.define() lines, so adding a new sound accumulates onto the
 * ones already there rather than replacing them--no separate sidecar needed.
 */
export function extractSoundDefines(existing: string): Record<string, string> {
	const map: Record<string, string> = {};
	const re = /SFX\.define\('([^']*)',\s*'([^']*)'\)/g;
	let match: RegExpExecArray | null;

	while ((match = re.exec(existing)) !== null) {
		map[match[1]] = match[2];
	}

	return map;
}

function buildManagedBlock(defines: Record<string, string>): string {
	const defineLines = Object.keys(defines)
		.sort()
		.map(name => `SFX.define('${name}', '${defines[name]}');`)
		.join('\n');

	return [
		MANAGED_SOUND_BEGIN,
		HOWLER_SOURCE,
		SFX_WRAPPER,
		defineLines,
		CHAPBOOK_INSERTS,
		MANAGED_SOUND_END
	]
		.filter(Boolean)
		.join('\n');
}

/**
 * Returns a new Story JavaScript string with the sound library present and the
 * given sound registered. Idempotent: the whole managed block is regenerated
 * each call from the merged define set, so re-adding a sound never duplicates
 * Howler and only the SFX.define() list grows. The block is placed at the top,
 * ahead of any hand-written Story JavaScript, so window.SFX exists before author
 * code that might use it runs on load.
 */
export function mergeSoundLibrary(
	existingScript: string,
	name: string,
	relativePath: string
): string {
	const defines = extractSoundDefines(existingScript);

	defines[name] = relativePath;

	const rest = removeManagedSoundBlock(existingScript);
	const block = buildManagedBlock(defines);

	return rest ? `${block}\n\n${rest}` : `${block}\n`;
}
