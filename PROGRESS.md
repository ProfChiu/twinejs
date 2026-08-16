# Twine121 — Progress

## 2026-08-16 (collapsed the fork to one branch, repo renamed to TWINE121)
- Accomplished: the fork had inherited 32 stale branches from upstream at some point (old PR
  branches like `fix-story-deletion`, `add-pwa`, several `dependabot/*` dependency bumps, plus a
  separate `main` that had drifted from `develop`)--none of it was our work, and it cluttered the
  branch switcher. Verified first that this was safe to clean up: no open PRs on the fork, no
  branch protection, and `twine121` already contained every commit `develop` had (confirmed via
  `git log origin/twine121..origin/develop`, empty). Deleted the stale `main`, pushed `twine121`'s
  content into a fresh `main`, set it as the repo's default branch, then deleted the other 31
  branches. Repository is now a single `main` branch holding all of Twine121's work--this is also
  what fixes the README problem from earlier today: since GitHub renders the front page from the
  default branch, and `develop` (the old default) never had the Twine121 README, only branches you
  explicitly visited showed it. Now the front page shows it directly. Also renamed the GitHub
  repository itself from `twinejs` to `TWINE121` (`github.com/ProfChiu/TWINE121`)--updated the
  local git remote and the three places that hardcoded the old URL (`twine121-info.ts`'s
  `forkRepoUrl`, `package.json`'s `repository.url`, and the README's download link).
- Decisions: two of the git operations (deleting/recreating `main`, changing the default branch)
  were blocked by Claude Code's own auto-mode safety classifier as too destructive to run
  unattended, even with the professor's explicit go-ahead already given in chat--the professor
  ran those two commands himself via the `!` prefix, then work continued normally. Deleting the
  other 31 branches and the repo rename went through directly since they were run after that.
- Verified: `git ls-remote --heads origin` shows exactly one branch (`main`); `gh repo view` confirms
  the new name, default branch, and that it's still public; the GitHub API's `/readme` endpoint
  resolves against the new default branch; the existing `1.0.0` release and its two installer
  assets are still reachable under the new repo name (tags aren't affected by branch or repo
  renames). GitHub auto-redirects the old `ProfChiu/twinejs` URL, so anything already shared
  under the old name keeps working.
- Next: nothing outstanding here. The old `github.com/ProfChiu/twinejs` links will keep
  redirecting indefinitely per GitHub's normal behavior, but worth using the new
  `ProfChiu/TWINE121` URL going forward.

## 2026-08-16 (app icon, first packaged Mac/Windows builds, GitHub release)
- Accomplished: gave Twine121 its own app icon (`assets/ICON_v2.png`, 1024x1024, the nurse
  mascot on a solid blue field with no wordmark) after an earlier draft (`assets/ICON.png`, a
  wordmark + dense crosshatching on a two-tone gray inset) failed a small-size check--simulated
  downscale to 32px and 16px showed it dissolving into unreadable gray noise. v2 holds up as a
  clear silhouette at both sizes. Wired it into the actual build (`icons/app-release.png` for
  macOS, and a hand-generated multi-resolution `icons/app-release-no-padding.ico` for Windows--
  no ImageMagick on this machine, so used Python/Pillow instead, which embeds correctly). First
  successful packaged builds for both platforms: `Twine121-2.12.0-macOS.dmg` (universal,
  arm64+x64) and `Twine121-2.12.0-Windows.exe` (NSIS installer). Tagged `1.0.0` (matching
  `twine121Info.version`, not package.json's upstream 2.12.0) and published both installers as
  GitHub Release assets on `github.com/ProfChiu/twinejs`. Also rewrote the root `README.md` with
  a Twine121 section and a Download pointer to this repo's own Releases page--framed generically
  as "a friendlier fork of Twine," no SCAD or class-number mentions, per direct instruction.
  Committed and pushed everything still outstanding from the day's earlier work too (the
  HTML/CSS start screen rebuild, self-hosted fonts, backdrop transparency)--none of it had been
  committed yet.
- Decisions: the first packaging attempt (unsigned Mac + Windows, no code-signing creds present)
  failed partway through the Windows step with a corrupted `resources/app.asar` and a stray
  Dropbox-conflict-looking file (`dxcompiler 2.dll`)--root cause is that this project directory
  lives inside a live Dropbox sync folder, and Dropbox appears to interfere with electron-builder
  writing large intermediate files mid-build (this likely also explains an earlier corrupted
  Electron zip download the same day). Fix: pointed electron-builder's `directories.output` at a
  scratch path outside Dropbox for the packaging step only (source files, web build, and
  electron-main build stay in place)--rebuild succeeded clean on the first retry. Left
  `assets/ICON.png` (the rejected v1) and `ReferenceStartScreen/` untracked rather than
  committing dead-end material, matching how `Mockup.psd` was already handled.
- Verified: `tsc --noEmit` and `npm run lint` clean before committing; extracted the built
  macOS app's actual `.icns` back out to a PNG and visually confirmed the intended artwork is
  what's embedded, not a stale or wrong file.
- Next: neither installer is code-signed (no Apple Developer or Windows signing cert configured
  here)--students will see a one-time Gatekeeper/SmartScreen warning, noted in the README. Say
  the word if a real signing credential becomes available later.

## 2026-08-16 (start screen rebuilt as real HTML/CSS, not a PNG)
- Accomplished: replaced the flat `start.png` start screen with a genuine markup version, ported
  from the Claude Design export in `ReferenceStartScreen/TWINE121-title-snippet.html` (the
  17.8 MB `-standalone.html` in that folder turned out to be an internal Claude Design bundler
  artifact--`__bundler/manifest` script tags, no usable markup--so it was not used). Version,
  date, "Based on Twine 2.12.0", and the GitHub link are now real text/`<a>` driven by
  `twine121Info`, not pixels baked into an image--the maintenance debt logged yesterday
  ("re-export the PNG on every version bump") is gone; bumping `twine121-info.ts` is enough.
  Layout uses CSS container-query units (`cqw`/`cqh`) inside the card, so it scales cleanly with
  window size instead of just clamping like the old raster image did. Added a subtle floating
  animation on the mascot and a short scale-pulse on the Start button on click (both skipped
  under `prefers-reduced-motion`); the Start button now animates for ~200ms before the screen
  closes rather than closing instantly. `assets/mascot/nurse-action.png` in the reference export
  turned out to be byte-identical to `start-pose1.png`, already vendored--no new art needed.
  M PLUS Rounded 1c (700/900) and Rajdhani (400/600/700), Latin subset only, are self-hosted at
  `src/twine121/about/fonts/` (~90 KB total) so the screen never depends on a live fetch to
  Google Fonts.
- Decisions: kept everything for this screen self-contained under `src/twine121/about/`--markup,
  CSS, and fonts together--specifically so it stays easy to keep editing (the professor's ask).
  Meta rows (Version/Last updated/Based on/Original project) are a plain array literal in
  `start-screen.tsx`; adding a row is adding one object plus one locale key, no new abstraction.
  Fetched full Latin-subset font files rather than hyper-subsetting to today's exact on-screen
  characters--the professor plans to keep changing this copy, and a subset locked to today's text
  would silently show a fallback face for any future character outside it.
- Verified live in a real browser at two window widths: both self-hosted font families report
  loaded (`document.fonts.check`) and are actually applied (`getComputedStyle().fontFamily`); the
  mascot carries the float animation; clicking the original-project link opens
  `github.com/klembot/twinejs` in a new tab and leaves the screen up; clicking the Start button
  shows the `is-pressed` class before the screen closes (confirmed screen stays up through the
  ~200ms animation, then closes); clicking the background dismisses immediately. 277 suites /
  1967 tests, tsc and eslint clean.
- Next: nothing outstanding on the start screen. `ReferenceStartScreen/` (still untracked, 18 MB)
  is now fully superseded--say the word to delete it. Everything here is still uncommitted.

## 2026-08-16 (start screen backdrop + first push to GitHub)
- Accomplished: start screen backdrop is now 50% transparent (`rgba(5, 5, 5, 0.5)` instead of
  solid `#050505`), so the library and toolbar show through dimmed around the artwork — verified
  live at 1440×900. Then committed **all** uncommitted work — Phase 0 through the start screen,
  121 files — as one commit and pushed `twine121` to `origin` (ProfChiu/twinejs), which had no
  such branch before. Commit `92aa2c8c`; branch now tracks `origin/twine121`.
- Decisions: one commit rather than reconstructed per-phase commits — the file changes are
  interleaved across phases, so split commits would be guesswork and wouldn't individually build.
  Per-session history lives here in PROGRESS.md instead. Excluded from the commit and left
  untracked: `assets/Mockup.psd` (4.5 MB working file) and `ReferenceStartScreen/` (18 MB, the
  superseded Claude Design export) — say the word to add either. `.claude/` (a machine-local
  lock file) is now gitignored. `assets/*.png` were committed as the splash's source art.
- Note: `start.png` has a drop shadow baked into its transparent margin. Invisible against the
  old solid backdrop; at 50% it reads as a dark halo past the plate's rounded corners. Looks
  intentional, so left alone — removing it means re-exporting the PNG, not a CSS change.
- Verified before pushing: 277 suites / 1965 tests passing, `tsc --noEmit` clean, eslint clean.
- Next: optional 2× re-export of start.png; confirm 1.0.0 as the Twine121 version number.

## 2026-08-16 (start screen replaced with the designed artwork)
- Accomplished: replaced yesterday's HTML startup dialog with `assets/start.png` (the Claude
  Design comp) shown full-window on a near-black stage. Click anywhere / Escape / Enter / Space
  dismisses. A transparent hotspot sits over the `github.com/klembot/twinejs` text drawn into the
  artwork and opens the repo; it stops propagation so the screen stays up while the browser takes
  focus. New `start-screen.tsx` + `.css`; deleted `startup-dialog.tsx`. The AI Use Disclaimer
  dialog is unchanged and now has its own toolbar button (the artwork has no link for it), and
  "Show the Twine121 start screen at launch" moved to Preferences.
- Decisions (professor's call, this session): use the flat image as-is rather than porting the
  exported HTML/CSS — the point is to signal "custom fork", not pixel-perfect responsiveness.
  Consequences accepted and to revisit: the version, date, and "Based on Twine 2.12.0" are baked
  into the PNG, so **`start.png` must be re-exported whenever the version changes** (`twine121-info.ts`
  still holds the real values and feeds the hotspot's URL); and the art is 1066×581, so it will
  look soft scaled up on large/Retina displays — a 2× re-export fixes that whenever wanted.
  Mascot/text overlap in the artwork is intentional, not a bug. All webfont work from the earlier
  plan is moot — the type is pixels now.
- Verified live in a real browser: hotspot centre lands at 79.8%/61.0% of the artwork and holds
  at two window sizes (measured against the link's true position, 71.5%–88.2% horizontally);
  clicking it opens a new tab to the repo and leaves the screen up; clicking elsewhere dismisses;
  Escape dismisses; reopen from "About Twine121" works; the new "AI Use Disclaimer" toolbar button
  opens the dialog. 277 suites / 1965 tests, tsc and eslint clean. (One transient `tag-editor`
  worker failure on the first full run; passes in isolation and on rerun — same pre-existing
  flakiness noted before, unrelated.)
- Next: optional 2× re-export of start.png; commit when ready (still nothing committed on `twine121`).

## 2026-08-15 (TWINE121 startup popup + AI Use Disclaimer)
- Accomplished: new centered startup modal (`src/twine121/about/`) — title TWINE121,
  `start-pose1.png` on the left, what it forks from, links to klembot/twinejs and this fork,
  version/last-updated/based-on facts, GPL-3.0 + not-endorsed-by-Twinery note. A footer link
  opens a second popup, **AI Use Disclaimer**, using `start-nurse.png`: what was built with AI
  assistance (per-story folders, asset manager, Layout designer, Add Image/Sound, test buttons,
  this popup), how the work was directed and reviewed by a human, who is accountable, and why
  disclose. Shows every launch with a "Show this at startup" checkbox (new `showTwine121Startup`
  pref); reopenable any time via a new "About Twine121" button in the Twine121 toolbar tab.
- Decisions: **Twine121 now carries its own version (v1.0.0, `twine121-info.ts`), separate from
  package.json's 2.12.0** — that number is upstream Twine's and moves on merge, so showing it as
  "the Twine121 version" would be false; the dialog shows both. Bump `version`/`lastUpdated`
  there by hand at release. Disclaimer is about the app only (no course-policy content, per your
  call). Built as a modal shell rather than the app's DialogCard — that's a side panel and can't
  carry a full-height graphic. Art sits on a fixed light plate in both themes because the PNGs
  are black line art on transparency.
- Verified live in a real browser (headless Chrome, isolated profile): both popups render,
  images load, links resolve, Escape/scrim/buttons close, checkbox persists to local storage,
  no auto-open after opting out, reopen from the toolbar works, dark theme and narrow/stacked
  layouts both correct. **The live pass caught a real crash unit tests could not**: the provider
  was mounted outside the app's `<Suspense>` boundary and `useTranslation()` suspends, so the
  app fell into its error boundary on launch — fixed by moving it inside. 32 new tests
  (including a locale-key coverage test, since react-i18next is mocked and would hide typos);
  full suite 277 suites / 1970 tests, tsc and eslint clean.
- Next: confirm you want v1.0.0 as the Twine121 version number, then commit (still nothing
  committed on `twine121`).

## 2026-08-07 (follow-up — fixed Screen Layout crash on existing stories)
- Bug (reported): clicking Screen Layout threw `TypeError: Cannot read properties of undefined
  (reading 'map')`. Cause: `useLayoutTokens` loaded a saved `twine121.json` layout wholesale;
  sidecars saved before this session lack `passageBackgrounds`, so `tokens.passageBackgrounds`
  was undefined and the new tag→image list did `.map` on it. (Older tokens like `alignLeft`
  dodged this only because they're used in truthy checks, not `.map`.)
- Fix: `useLayoutTokens` now merges the saved layout OVER `defaultLayoutTokens()`, so any token
  added after a sidecar was written gets a default instead of undefined — migration-safe for all
  future tokens. Added a `?? []` guard in `generate-css` too. Regression test added (older
  sidecar → passageBackgrounds:[], leftGap:0). 93 layout tests + tsc + eslint clean.
- Restart the app (start:electron rebuilds) to pick up the fix — the crash is in the built bundle.

## 2026-08-07 (Layout Designer — per-tag passage backgrounds + Left Gap)
- Accomplished: two Harlowe-only additions to the Layout Designer. (1) **Per-tag passage
  backgrounds** — a repeatable "tag → image" list; each row emits
  `tw-passage[tags~="<tag>"]{ background-image: linear-gradient(scrim,scrim), url('images/..') }`
  (confirmed from the Harlowe runtime that it puts a `tags` attribute on `tw-passage`; the
  scrim = backgroundColor@50% keeps text legible). (2) **Left Gap** slider on top of the
  existing alignLeft toggle: when Align-Left is on, a gap (px) sets `tw-passage{margin:0 auto 0
  <gap>px}`, and `tw-story{padding-left:0}` is emitted (when no left panel) so gap 0 sits truly
  flush against the window edge; if a left panel is reserved, the gap adds on top of it.
- Files: `layout-tokens.ts` (new `leftGap`, `passageBackgrounds[]` tokens + PassageBackground
  type), `generate-css.ts` (margin/padding + per-tag rules, reusing `hexToRgba`),
  `layout-designer-dialog.tsx` (Left Gap slider + tag/image list reusing the image picker),
  `layout-mock-preview.tsx` (preview honors leftGap), `layout-designer-dialog.css`,
  `en-US.json`. Chapbook shows the existing "not supported" note for both.
- Verified: 92 layout tests (added generate-css cases for gap 0/flush, gap>0, panel+gap,
  per-tag rules + skipping incomplete rows; fixed one pre-existing alignLeft dialog test that
  asserted the managed block before any control change). Web tsc + eslint clean; full suite +
  electron tsc running. Did NOT run a live in-app browser check (budget) — the one external
  fact, Harlowe's `tags` attribute, is confirmed at the source level; offer a live check if wanted.

## KNOWN BUG (logged 2026-08-07, not yet fixed) — Add Sound music on the FIRST node
- Symptom (reported by professor): with the fixed Add Sound wrapper, music placed on the
  **second** passage plays correctly, but music placed on the **very first** passage does
  not. Deferred by the professor — log only, do NOT spend budget chasing it now.
- Likely cause (hypothesis, unverified): the only gesture that can unlock first-passage
  audio is the click that *also navigates away* from the first passage. Our capture-phase
  `onFirstGesture` replays the recorded track on that click, but the same click then drives
  Harlowe to node 2, whose own `<script>SFX.play(...)</script>` runs and likely supersedes
  or stops the just-started node-1 track (different/same sound, or an implicit stop). Net:
  node-1 music has ~no dwell time after the unlocking gesture. Second-node music works
  because the player already interacted (page has user activation) so it plays immediately.
- Directions to try when revisited: (1) don't stop/replace an already-playing track when
  node 2 requests the *same* sound (dedupe by name — skip if that Howl is already playing);
  (2) consider a Harlowe `startup`/`header`-tagged setup passage pattern for opening music;
  (3) or advise authors to start opening music on node 2 after a "Begin" click. Reproduce
  with the real click→navigate flow (not a synthetic keydown, which doesn't navigate).

## 2026-08-07 (Add Sound — Howler-powered SFX/music, both formats · Phase 4 first library)
- Accomplished: new "Add Sound ▾" button in the passage-edit toolbar (beside Add Image)
  opens a "Sound Console" popup — pick/import a sound, Play/Stop, Loop vs Play-once,
  Volume, optional Stop-after-N-seconds — that inserts a format-correct trigger at the
  cursor AND idempotently installs vendored Howler.js core (v2.2.4, MIT) + a thin
  window.SFX wrapper into the story's Story JavaScript. Harlowe →
  `<script>SFX.play('name',{...})</script>`; Chapbook → a custom `{play sound:'name',...}`
  insert registered via engine.extend (guarded so the same block is inert in Harlowe). All
  six verbs work identically in both formats. New `src/twine121/passage-sounds/`; reuses the
  existing sounds-import backend, `isChapbookFormat`, and the layout designer's managed-block
  pattern. Chapbook definitions rely on testing from the startup node (per your call — the
  editor-side "test from any node" injection was designed but deferred).
- Decisions: chose Howler over a hand-rolled wrapper (autoplay-unlock/mobile/overlap); one
  guarded managed block for both formats rather than branching; console uses the proven
  portal+outside-click pattern from the image menu.
- Verified: confirmed from runtime source that both formats run Story JS on load, Harlowe runs
  passage `<script>`, and the Chapbook custom-insert API, before building. 28 new tests + full
  271 suites/1922 tests, both tsc, eslint all clean. A syntax-validity test caught a real
  shipping bug — a plain template literal ate Howler's regex backslashes (`/OPR\/(\d+)/` →
  `/OPR/(d+)/`); re-vendored as a JSON-encoded string and confirmed intact in a real
  production web build's bundle. Real Howler+SFX load in jsdom without error.
- Not done: live audio playback in a running app — same CDP limits as prior features (native
  file picker can't be scripted; autoplay needs a user gesture), so that's your real-hardware
  step. Nothing committed yet (all on `twine121`).
- Next: your live playback check; commit when ready.

## 2026-08-07 (follow-up 3 — fixed Add Sound / Howler in the TEST project)
- Problem: the Add Sound (Howler) system still played nothing in Stories/test even after
  the earlier eager-preload + html5:true fixes and an added autoplay queue. Diagnosed live
  via CDP over file:// on the real test.html: `SFX.play` works perfectly when called during
  a user gesture (played `unity` live), so Howler/paths/loading are fine. The bug was the
  autoplay-unlock QUEUE itself — it decided what to replay from Howler's `playerror` event,
  which races Howler's internal load queue (esp. large files), so on the first real gesture
  it replayed nothing or re-blocked. Confirmed: neither click nor keydown started the queued
  sounds, yet a fresh `SFX.play` inside the same gesture did.
- Fix (`install-sound-library.ts` SFX wrapper): stop relying on `playerror`. Now every play
  requested before the first interaction is recorded (latest per name); on the first
  click/tap/key we stop+replay them fresh inside the gesture (proven reliable). Simpler and
  race-free. Regenerated the managed block in both test.html and _preview.html so the TEST
  project works now (source-of-truth is test.html; _preview regenerates on Test anyway).
- Verified live on the actual test.html: before any interaction both sounds blocked
  ([false,false]); after the first keypress both play and advance ([true,true], seek 2.12),
  no double-play. 29 passage-sounds tests + tsc + eslint clean. Restart notes: any story
  edited with Add Sound from now on gets the fixed wrapper; existing stories need their
  block regenerated (re-click Add Sound, or it was done here directly).

## 2026-08-07 (follow-up 2 — fixed the Cyberpunk story's silent music)
- Diagnosed live (headless Chrome, CDP, real file:// on the actual published story): the
  "Cyberpunk 2088 SP26 v5 - Harlowe" story uses its OWN hand-written `playsound` (not the
  Add Sound/Howler wrapper — 0 `SFX.play` refs). The script, paths, and playback are all
  correct; the silence was purely browser autoplay policy — music starts on the opening
  passage before any click, so `mus.play()` is rejected (NotAllowedError) and the script
  logged "Music blocked" but never retried.
- Fix: added a first-gesture audio-unlock to that story's Story JavaScript (the
  `twine-user-script` block in its .html, app closed): new `_armAudioUnlock` helper, the
  music `.catch` now queues the blocked track (`_pendingMusic`) and arms the unlock, and
  stopmusic/stopsound/stopallsounds clear the pending track. SFX left as-is (already
  gesture-triggered). Verified end-to-end: with real autoplay policy the music is blocked
  + queued on load, then a genuine CDP click starts it (playing, currentTime advancing,
  queue drained). Story script still syntax-valid. Durable — the editor re-emits
  story.script verbatim on save. (Also flagged a pre-existing typo: one cue points at
  sounds/unityx.mp3; the file is unity.mp3.)

## 2026-08-07 (follow-up — fixed silent playback you reported)
- Bug: your test story played no sound. Reproduced live in a real browser over file://
  (how Test/Play opens the preview) via headless-Chrome CDP. Two real causes in the SFX
  wrapper: (1) `define` created the Howl LAZILY on first play, so `preload:true` never ran
  ahead of time — the first play raced an unloaded sound and the deferred play (fired from
  the load callback, outside the click's call stack) silently never started; (2) Howler's
  default Web Audio loads via XHR, which is blocked on file:// (a plain <audio>/media
  element is not — the reason LearnTwine used <audio> tags).
- Fix (`install-sound-library.ts` SFX wrapper): create each Howl EAGERLY in `define`
  (real preload at story start) and force `html5: true` (media-element playback, reliable
  on file://). Verified end-to-end from the actual shipped source over file://: state
  "loaded" at play, 'play' event fires, playing()===true, no errors. 28 passage-sounds
  tests + tsc + eslint still clean.
- Still inherent (not a bug): browsers block autoplay until the player interacts, so a
  sound on the very FIRST passage won't fire until a click/keypress — put audio on a
  passage reached via a link, or after a "Begin" click. Restart the app (start:electron
  rebuilds) to pick up the fix.

## 2026-08-06 (Phase 3 follow-up #4 — pinned "From Start"/"Current" test buttons)
- Accomplished: from your mockup, added two always-visible, high-contrast pill buttons
  (`src/twine121/story-launch/`) to the story-edit toolbar's pinned controls (next to
  Zoom/Undo-Redo), so testing — the highest-frequency author action — never requires
  switching tabs. "From Start" always launches from `story.startPassage`. "Current"
  reads the front id of the open `PassageEditStack` dialog via `DialogsContext` (no new
  state needed — that ordering already existed) and greys out when no passage editor is
  open. Along the way, found and fixed a real latent bug while making "always available"
  true for From Start: the Delete/Backspace hotkey in `delete-passages-button.tsx` bypassed
  the button's own disabled guard, so selecting the start passage and hitting Delete could
  silently orphan `story.startPassage`. Fixed by having the hotkey handler check the same
  guard the button already enforces.
- Verified live via CDP: button enable/disable transitions on opening/closing a passage
  editor, Current launches the focused passage (confirmed `startnode` in the generated
  preview HTML matches the open passage's `pid`), and the hotkey fix blocks deleting the
  start passage while still allowing normal passage deletion. Also 268/268 test suites and
  `tsc --noEmit` pass.
- Incident, self-caught and corrected: first verification attempt tried to isolate the
  Electron run by setting `HOME` to a scratch dir before launch — this **did not work**
  (Electron resolves `documents` via a native macOS API, not the `HOME` env var), so the
  app briefly ran against your real `~/Documents/Twine121` library: it wrote one disposable
  `_preview.html` into the real `test` story folder (removed) and ran its normal
  auto-backup/prune cycle a cycle early (nothing lost — pruned entry was itself just an
  older auto-backup). Caught it by reading the electron log before proceeding further,
  stopped, reported it to you in full rather than continuing or minimizing it. Rebuilt
  verification using a real isolation mechanism instead: `story-directory.ts` already
  supports `storyLibraryFolderPath`/`backupFolderPath` app prefs settable via CLI args
  (`--storyLibraryFolderPath=...`), which Electron actually honors, no source changes
  needed. Reran all live checks against a copied story in a genuinely separate scratch
  folder; confirmed nothing touched the real library the second time.
- Decisions: kept the existing Build-tab Test/Play and Passage-tab "Test From Here"
  buttons in place — not removed, per earlier discussion, since you hadn't asked for that.
- Next: no open items from this feature. Still nothing committed to git — all Phase 0-3
  work plus this session's changes remain uncommitted on the `twine121` branch, awaiting
  your go-ahead. Phase 4 (curated JS library catalog) is still next up when you're ready;
  it starts with a ~30 min spike testing whether Harlowe/Chapbook execute multiple
  `<script role="script">` tags.

## 2026-08-05 (Phase 3 follow-up #3 — "Add Image" toolbar button in the passage editor)
- Accomplished: after you reported the crash-fixed right-click menu still didn't open on
  your real hardware right-click, you proposed (with a screenshot) putting an "Add Image"
  button directly in the passage editor's own toolbar instead. Built it: new
  `AddPassageImageButton` reuses the existing, already-proven `MenuButton` dropdown
  (rather than a custom popup), wired into `PassageToolbar` between Rename and Test From
  Here. Clicking it shows the same four alignment options (Anchor, Float Left, Float
  Right, Centered); picking one opens the native file picker and inserts the image HTML.
- Improvement over the original design, not just a relocation: because the passage
  toolbar already holds the passage's live CodeMirror `editor` instance, images now
  insert **at the cursor position** via `editor.replaceSelection()` instead of always
  being appended to the end of the passage text (a known limitation of the right-click
  version, which could open on a passage that wasn't even being edited).
- Verified live end-to-end via CDP against an isolated `/tmp` story library (never your
  real folder): created a story, selected its passage, opened the passage editor,
  confirmed "Add Image" renders in the toolbar, clicked it, confirmed all four alignment
  options appear, clicked one, confirmed the native file picker opens and the renderer
  stays fully responsive afterward (no crash) — same click-through limitation as before
  means the picker itself can't be scripted, but everything up to and through triggering
  it is now confirmed working. Full regression also clean: 266 suites / 1862 tests,
  lint, and both electron + web `tsc --noEmit`.
- Open question for you, not resolved unilaterally: the right-click menu on the passage
  card still exists in the codebase as a second entry point to the same feature, but its
  reliability on real hardware is now in doubt (crash fixed, but the popup-not-opening
  report came after that fix, on a real right-click, and was never independently
  reproduced). The toolbar button doesn't have that risk — it's a normal button click.
  Worth deciding whether to keep right-click as a redundant/optional path, or drop it and
  make the toolbar button the only entry point.
- Next: awaiting your decision on the right-click entry point above. Phase 4 (curated JS
  library catalog) remains the last planned phase. Nothing new committed to git yet.

## 2026-08-05 (bug fix — right-click menu crashed the app on selection)
- Accomplished: fixed a real crash in the just-shipped right-click "Add Image" menu,
  found after you reported the popup was missing. Root cause: `PassageImageMenu` closed
  itself via a plain `document.addEventListener('click', ...)` at the bubble phase,
  which raced React 16's own document-level synthetic event delegation for the *same*
  click on an alignment button--both paths tried to close/unmount the portaled menu at
  once, throwing `NotFoundError: Failed to execute 'removeChild' on 'Node'` and dropping
  the whole app into its error boundary ("Something went wrong and Twine can't
  continue"). That crash, not a rendering bug, is almost certainly what read as "the
  popup is missing." Fix: moved outside-click detection to a capture-phase `mousedown`
  listener that checks `contains()` against a ref on the menu itself--outside presses
  close immediately there and never race a button's own onClick, since exactly one path
  ever calls onClose() per interaction now.
- Verified live: reproduced the exact crash first (real hardware click via CDP's Input
  domain, not a scripted DOM event--jsdom-based unit tests never exercise this race,
  which is why the original test suite passed despite the bug), confirmed the same
  interaction after the fix leaves the app fully functional and closes the menu cleanly.
  Tests updated to match the new mousedown-based mechanism and to assert onClose fires
  exactly once, not just "at least once."
- Open item, not yet resolved: while debugging, CDP's simulated hardware right-click
  didn't reliably reach the passage card's onContextMenu handler the same way a
  scripted `dispatchEvent()` call does, even when landing on a genuine child of the
  card. Couldn't fully determine whether that's purely a limitation of driving
  Electron's remote debugging protocol (most likely, given real OS right-click input
  doesn't route through CDP's Input domain the same way) or a hint of something else
  format/input-method specific (trackpad two-finger-tap vs. mouse vs. Ctrl+click all
  register as "right-click" on macOS but could plausibly differ at the edges). Asked
  you to retest with the crash fix in place--if the popup still doesn't appear after
  this, that's the next thing to chase, with your exact input method as a starting
  clue.
- Next: awaiting your retest. Phase 4 (curated JS library catalog) still the last
  planned phase after this settles. Nothing new committed to git yet.

## 2026-08-05 (Phase 3 follow-up #2 — right-click "Add Image" on passage cards)
- Accomplished: right-click any passage card → a popup with four options (Anchor,
  Float Left, Float Right, Centered) → native file picker → chosen image(s) get
  format-agnostic `<img>` HTML appended to that passage's text, showing up in the
  text editor immediately (whether or not it's currently open). Supports "1 or more"
  naturally since the underlying file picker already allows multi-select — each
  chosen file gets its own line with the same alignment. New
  `src/twine121/passage-images/`: `alignedImageSnippet()` (pure), `useAddPassageImage`
  (hook wrapping import + undoable dispatch), `PassageImageMenu` (portal-rendered
  positioned popup). Threaded a new optional `onAddImage` prop through
  PassageCard → PassageCardGroup → PassageMap → MarqueeablePassageMap →
  story-edit-route (undefined outside Electron, which hides the feature rather than
  showing a broken action). 17 new tests, full suite 1855 passing, lint and both tsc
  configs clean.
- Decisions: tested live (not assumed) whether raw HTML with inline styles
  (`style="float:left"` etc.) actually renders in Chapbook passages before building
  anything — it does, Chapbook doesn't strip or escape it. That meant no format
  branching was needed for this feature at all, simpler than the earlier anchor-image
  work. "Anchor" alignment reuses the exact `class="scene"` markup the Images & Sounds
  panel's "Insert as Anchor" already produces (not a second competing mechanism), so
  it still respects the Layout Designer's Anchor Image Gap control; the other three
  alignments are plain per-image inline styles, deliberately not run through the
  Layout Designer since they're a one-image choice, not a story-wide setting. New
  images append to the end of the passage's text (no cursor-position targeting) since
  the menu can open on a passage that isn't even open for editing. Popup renders via
  a React portal straight into document.body--confirmed live that the passage map's
  CSS transform (for zoom) would otherwise make position:fixed math resolve against
  the wrong ancestor, not the viewport.
- Verified live: right-clicked a real passage card, confirmed the menu appears with
  the correct four labels, confirmed via computed styles that it's a genuine
  document.body child using position:fixed (not trapped by the zoom transform), and
  confirmed outside-click closes it. Did not click through into the native file
  picker live (same constraint as Phase 1's asset import testing--no way to drive an
  OS-native dialog via CDP without risking a hang); that leg of the flow is instead
  verified against the real Redux reducer and updatePassage action creator (not
  mocked) in the automated suite.
- Next: Phase 4 (curated JS library catalog) still the last planned phase. Nothing new
  committed to git yet.

## 2026-08-05 (Phase 3 follow-up — per-passage anchor images)
- Accomplished: added the anchor-image feature you asked for after testing Phase 3 —
  each passage can now carry its own image that the following text positions itself
  below, with a tunable gap. Reuses LearnTwine Ch. 7's own verified `class="scene"`
  convention rather than inventing new markup. New "Anchor Image Gap" slider in Screen
  Layout (placed where you circled it, right under Font) generates
  `tw-passage img.scene { display:block; max-width:100%; margin:0 auto <gap>px; }` in
  the managed stylesheet block. New "Insert as Anchor" button next to each image in
  Images & Sounds copies format-aware markup to the clipboard: Harlowe
  `<img class="scene" src="...">`, Chapbook `{embed image: '...', alt: '...'}` (Ch. 7's
  own verified Chapbook insert). 21 new tests, full suite 1834 passing, lint and both
  tsc configs clean.
- Decisions: confirmed with you first that this was per-passage (a different image per
  scene) rather than one story-wide image, since the two readings meant materially
  different implementations. Chapbook has no verified per-image spacing config key, so
  the gap control shows the same "Chapbook doesn't support this" note as the other
  Harlowe-only controls — the insert-as-anchor snippet still works there (via
  Chapbook's own `{embed image}`), just without gap control. Kept the anchor image's
  own sizing (block, max-width 100%, centered) fixed rather than adding a
  frame/border token — matches exactly what was asked, no scope creep.
- Verified live: set the gap to a distinctive 77px in the real running app, confirmed
  the exact value flowed into the generated Story Stylesheet, then inserted the
  class="scene" markup into a real passage, hit Test From Here, and confirmed the
  generated preview file contains both the image markup and the matching CSS rule
  together with a real image file at the referenced path.
- Next: Phase 4 (curated JS library catalog) still the last planned phase. Nothing new
  committed to git yet.

## 2026-08-05 (Phase 3 — reprioritized ahead of Phase 2)
- Accomplished: Phase 3 (visual layout designer) complete and verified live. Per your
  instruction to prioritize creation over upload (the SCAD Web Uploader tool already
  covers upload — see the reprioritization note below), skipped straight to the
  designer. New `src/twine121/layout/`: preset picker (Visual Novel/Centered
  Book/Sidebar/Full-Bleed) + tunable tokens (font, text size, text/background/link
  color, stage width, dialogue box position/height/padding/opacity, backdrop image
  picked from the story's own images/) over a live mock preview. "Screen Layout"
  toolbar button added next to Stylesheet/Images & Sounds. 76 new tests, all passing;
  full suite 1824/1889; lint and both tsc configs clean.
- **Major discovery, changes the plan's premise:** re-reading LearnTwine's Ch. 7 (the
  plan's own cited source) showed Chapbook doesn't use CSS for this at all — it's
  styled via `config.style.*` key/value lines in the story's **first passage's vars
  section**, a completely different edit target than Harlowe's Story Stylesheet, not
  just a different CSS selector as the original plan assumed. Built both paths for
  real: Harlowe gets generated CSS merged into a managed block at the *top* of the
  stylesheet (discovered mid-build that `@import` must precede every other CSS rule,
  so "append" from the original plan text would have silently broken font loading —
  changed to prepend); Chapbook gets managed `config.style.*` lines merged into the
  start passage's vars section by exact key match, leaving hand-written vars/story
  text untouched, no comment-marker syntax invented. `MANAGED_CHAPBOOK_KEYS` is a
  closed, source-verified list (googleFont, page.font, page.color, backdrop,
  page.verticalAlign, page.link.color) — nothing added without a citation in
  LearnTwine's content. Two font entries (Cinzel/Creepster Chapbook `page.font`
  values) extrapolate the verified `Name/fallback size` pattern to fonts LearnTwine
  only showed on the Harlowe side — flagged as worth a real-Chapbook check later,
  same as press-start-2p/courier-prime (both verified exact).
- Decisions: stage max-width, dialogue box height/padding/opacity, and backdrop
  *image* have no verified Chapbook config equivalent (backdrop only takes a color,
  per LearnTwine Ch. 2's explicit "honest limit") — rather than fabricate a workaround,
  the dialog shows a "Chapbook doesn't support this" note next to those controls
  instead of hiding them, matching the book's own "guide, don't block" + honest-limits
  teaching style. `useLayoutTokens` only writes to the story/passage when a control is
  actually changed, never just from opening the dialog — avoids silently stomping
  hand-written CSS the moment someone views the panel. Found and fixed a real bug
  during test-writing: an early version called `dispatch()` inside a `setState`
  updater function, which React can invoke during its render phase (`react-dom` warned
  "Cannot update a component while rendering a different component") — moved the
  dispatch/sidecar-save side effects into the callback body instead.
- Verified live: launched against an isolated test folder, hand-wrote CSS in the real
  Stylesheet dialog, then opened Screen Layout and switched presets — confirmed via
  the Stylesheet dialog afterward that the managed block sat at the top (import first)
  with the new preset's real generated CSS, and the hand-written rule survived
  untouched below it. Closed and reopened the designer — same token values came back
  (not reset to defaults), confirmed both via the UI and by reading the story's
  `twine121.json` sidecar directly off disk. Did not get to live-verify the Chapbook
  vars-section path through the app's own format-switcher UI (couldn't quickly locate
  that control) — that path is instead verified against the *real* Redux reducer and
  `updatePassage` action creator (not mocked) in the automated test suite, which is
  the load-bearing logic either way.
- Next: Phase 4 (curated JS library catalog) is the last planned phase. Phase 2
  (SFTP) stays deprioritized per your call — SCAD Web Uploader
  (`__SCAD/_CLAUDE/_TOOLS/SFTPUPLOADTOOL/`) already covers it as a separate app;
  integrating it into Twine121 is optional future work, not blocking. Nothing new
  committed to git yet.

## 2026-08-04 (Phase 1)
- Accomplished: Phase 1 complete — per-story folders, the preview-path fix, the asset
  manager, and the reference validator, all built and verified live. Each story now
  lives in `Stories/<name>/` with auto-created `images/`+`sounds/` (created on first
  save via `ensureStoryAssetFolders()`), plus a `twine121.json` sidecar for future
  phases. `loadStories()`/`saveStoryHtml()`/`renameStory()`/`deleteStory()` all rewritten
  around the per-story folder; rename moves the whole folder, delete trashes the whole
  folder. One-time flat→folder migration (`migrateStoriesToFolders()`) runs at startup,
  guarded by a `storiesMigratedToFolders` app pref, after the existing
  `backupStoryDirectory()` call. Play/Test/Proof preview (`openStoryPreview()`, was
  `openWithScratchFile()`) now writes `_preview.html` inside the story's own folder
  instead of a shared Scratch/ folder — this is the fix for the broken-relative-image
  bug found during planning. New `src/twine121/assets/` (renderer): `StoryAssetsDialog`
  (list/import/reveal/delete/insert, wired into the Story toolbar tab as "Images &
  Sounds"), `checkAssetReferences()` (scans passage text + stylesheet for `src=`/CSS
  `url()` references, flags ones that won't resolve, surfaced as a non-blocking
  checklist inside the same dialog — hosted http(s)/data: URLs always pass). New
  main-process files: `story-assets.ts`+`.types.ts`, `story-sidecar.ts`+`.types.ts`,
  6 new IPC channels. 24 new/updated Jest suites, all passing; full project suite
  1768/1834 passing (1 pre-existing flaky drag-selection test, unrelated, confirmed
  passes in isolation); lint clean; both tsc configs clean.
- Decisions: Per your instruction, explicitly did NOT add any import path for existing
  stock-Twine stories from `~/Documents/Twine/` — Twine121 only migrates its own old flat
  layout. "Insert" copies plain `<img src="...">`/`<audio controls src="...">` HTML to
  the clipboard rather than inserting at a passage's CodeMirror cursor — the asset dialog
  is a story-level dialog with no access to whichever passage editor happens to be open
  (no global editor-ref registry exists anywhere in this codebase), and raw HTML tags
  are format-agnostic and match what LearnTwine's Sound & Image chapter already teaches,
  avoiding any risk of fabricating Harlowe/Chapbook macro syntax. `ensureStoryAssetFolders()`
  lives in `story-file.ts` (triggered on save), not `story-directory.ts` as the plan's
  pre-code-read draft assumed — `story-directory.ts` only manages the root library
  folder and has no access to individual `Story` objects. Split `StoryAssetKind`/
  `StoryAsset`/`StorySidecar` into sibling `.types.ts` files (matching the existing
  `stories.types.ts` convention) so shared/renderer code importing them doesn't pull
  `electron`/`fs-extra` runtime imports into the web bundle.
- Verified live (not just unit tests): launched the real Electron app against an
  isolated test Documents folder (never touched the professor's real
  `~/Documents/Twine121/Stories`), driven via Chrome DevTools Protocol. Confirmed:
  flat-file migration into `Stories/<name>/<name>.html` + `images/`+`sounds/`; new-story
  creation produces the same layout; a real `<img src="images/test.png">` passage
  reference resolved correctly in the generated `_preview.html` sitting next to the
  actual image file (the core bug fix); rename moves the entire folder; the Images &
  Sounds dialog lists real files placed directly on disk and its Delete button removes
  the file and live-refreshes the list with no manual reopen needed. One environmental
  slip caught and fixed mid-verification: the first launch didn't override
  `backupFolderPath`, so `backupStoryDirectory()` wrote one harmless backup snapshot to
  the real `~/Documents/Twine121/Backups/` — caught, isolated with `--backupFolderPath`
  on relaunch, and the stray snapshot removed afterward. Clipboard read/write
  (Insert button) couldn't be verified live because CDP-driven automation doesn't hold
  real OS window focus, which Chromium's Clipboard API requires — covered instead by
  the unit tests' mocked clipboard.
- Next: Awaiting go-ahead for Phase 2 (SFTP upload). Still need from you: the SCAD
  server hostname, protocol, auth method, per-student remote path, and public URL
  pattern — Phase 2 can start on a generic profile without these, but the "SCAD" preset
  can't be filled in until supplied. Nothing committed to git yet on the `twine121`
  branch — all Phase 0+1 work is unstaged/uncommitted, awaiting your go-ahead to commit.

## 2026-08-04 (Phase 0)
- Accomplished: Phase 0 complete. Forked klembot/twinejs (v2.12.0, `develop` branch) to
  github.com/ProfChiu/twinejs, cloned into Apps/Twine121/, working branch `twine121`
  created with `upstream` remote wired for future merges. Rebranded to Twine121
  (package.json name/productName, electron-builder appId/artifact names, `common.appName`
  locale key). `npm install` clean (1588 packages). `npm run start:electron` launches
  successfully — verified via live process tree (main + renderer + GPU processes), not
  just log output. Confirmed the rebrand took effect end-to-end: app created
  `~/Documents/Twine121/Stories/` and `~/Documents/Twine121/Backups/` on first run.
- Decisions: Kept `electron.storiesDirectoryName`/`scratchDirectoryName` locale keys
  unchanged ("Stories"/"Scratch") — only `common.appName` needed to change, since both
  folder names are built as `Documents/<appName>/<dirName>`. Did not run `npm audit fix`
  on the 86 pre-existing vulnerabilities in upstream's pinned dependency tree — fixing
  could silently bump majors and break the build; out of scope for a baseline-verification
  phase. Added `Apps/Twine121/` to the parent GAME121 `.gitignore` since it's a separate
  nested git repo.
- Next: Awaiting go-ahead to start Phase 1 (per-story `images/`+`sounds/` folders, the
  scratch-file preview fix, sidecar `twine121.json`, asset import/insert dialog). Also
  still open from plan review: whether Twine121 should one-time-import existing stories
  from stock Twine's `~/Documents/Twine/` folder, not just migrate its own old layout.
