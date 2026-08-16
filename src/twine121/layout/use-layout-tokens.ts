import * as React from 'react';
import {isElectronRenderer} from '../../util/is-electron';
import {TwineElectronWindow} from '../../electron/shared';
import {
	Story,
	storyWithId,
	updatePassage,
	updateStory,
	useStoriesContext
} from '../../store/stories';
import {defaultLayoutTokens, LayoutTokens} from './layout-tokens';
import {
	generateChapbookVarsLines,
	mergeChapbookVars,
	mergeManagedStylesheet
} from './generate-css';
import {isChapbookFormat} from '../format';
import {usePrefsContext} from '../../store/prefs';

const SIDECAR_LAYOUT_KEY = 'layout';

export interface UseLayoutTokensProps {
	loading: boolean;
	tokens: LayoutTokens;
	updateTokens: (patch: Partial<LayoutTokens>) => void;
}

/**
 * Loads a story's saved layout designer tokens (from its twine121.json
 * sidecar) and provides a function to update them, which both applies the
 * generated output to the story (Story Stylesheet for Harlowe, the start
 * passage's vars section for Chapbook) and persists the tokens themselves so
 * reopening the designer restores the controls without parsing CSS/config
 * back out.
 */
export function useLayoutTokens(story: Story): UseLayoutTokensProps {
	const [tokens, setTokens] = React.useState<LayoutTokens>(
		defaultLayoutTokens()
	);
	const [loading, setLoading] = React.useState(true);
	const {dispatch, stories} = useStoriesContext();
	const {prefs} = usePrefsContext();
	const twineElectron = isElectronRenderer()
		? (window as TwineElectronWindow).twineElectron
		: undefined;

	React.useEffect(() => {
		let cancelled = false;

		async function load() {
			if (!twineElectron) {
				setLoading(false);
				return;
			}

			try {
				const sidecar = await twineElectron.loadStorySidecar(story);
				const saved = sidecar[SIDECAR_LAYOUT_KEY];

				if (!cancelled && saved) {
					// Merge over the current defaults so a sidecar saved before a
					// token existed (e.g. passageBackgrounds, leftGap) still gets a
					// value instead of undefined--otherwise the designer crashes on
					// fields it assumes always exist (e.g. passageBackgrounds.map).
					setTokens({
						...defaultLayoutTokens(),
						...(saved as Partial<LayoutTokens>)
					});
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		}

		load();

		return () => {
			cancelled = true;
		};
		// story.id is the only part of `story` this effect should react to--a
		// fresh load should only happen when the designer is pointed at a
		// different story, not on every unrelated story edit.
	}, [story.id, twineElectron]);

	const updateTokens = React.useCallback(
		(patch: Partial<LayoutTokens>) => {
			// dispatch() and the sidecar save are side effects, so they run here
			// in the callback body--not inside a setTokens() updater function,
			// which React may invoke during its render phase and which must stay
			// pure.
			const next = {...tokens, ...patch};
			const currentStory = storyWithId(stories, story.id);

			if (isChapbookFormat(currentStory.storyFormat)) {
				const startPassage =
					currentStory.passages.find(p => p.id === currentStory.startPassage) ??
					currentStory.passages[0];

				if (startPassage) {
					dispatch(
						updatePassage(currentStory, startPassage, {
							text: mergeChapbookVars(
								startPassage.text,
								generateChapbookVarsLines(next, prefs.customGoogleFonts)
							)
						})
					);
				}
			} else {
				dispatch(
					updateStory(stories, currentStory, {
						stylesheet: mergeManagedStylesheet(
							currentStory.stylesheet,
							next,
							prefs.customGoogleFonts
						)
					})
				);
			}

			if (twineElectron) {
				twineElectron.saveStorySidecar(currentStory, {
					[SIDECAR_LAYOUT_KEY]: next
				});
			}

			setTokens(next);
		},
		[
			tokens,
			dispatch,
			stories,
			story.id,
			twineElectron,
			prefs.customGoogleFonts
		]
	);

	return {loading, tokens, updateTokens};
}
