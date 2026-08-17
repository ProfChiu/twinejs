import * as React from 'react';
import {usePrefsContext} from '../../store/prefs';
import {AiDisclaimerDialog} from './ai-disclaimer-dialog';
import {StartScreen} from './start-screen';

export interface StartupDialogContextProps {
	/** Opens the TWINE121 start screen. */
	openStartScreen: () => void;
	/** Opens the AI Use Disclaimer. */
	openAiDisclaimer: () => void;
}

export const StartupDialogContext =
	React.createContext<StartupDialogContextProps>({
		openAiDisclaimer: () => {},
		openStartScreen: () => {}
	});

StartupDialogContext.displayName = 'StartupDialog';

export const useStartupDialogContext = () =>
	React.useContext(StartupDialogContext);

type OpenDialog = 'none' | 'startScreen' | 'aiDisclaimer';

/**
 * Owns the Twine121 start screen: shows it once when the app finishes loading
 * (if the user hasn't turned that off in preferences), and lets anything in the
 * app reopen it later.
 *
 * This lives above the router rather than in a route so that it appears exactly
 * once per launch--route components remount as the user navigates. Mount it
 * inside <StateLoader> so prefs are already loaded, and inside the app's
 * <Suspense> boundary, since useTranslation() suspends.
 */
export const StartupDialogProvider: React.FC = ({children}) => {
	const {prefs} = usePrefsContext();
	const [open, setOpen] = React.useState<OpenDialog>('none');
	const autoOpened = React.useRef(false);

	// At most once per launch. The ref (not a bare mount-only effect) guards
	// against StrictMode's double-invoke and any re-render before the dialog
	// actually opens.
	React.useEffect(() => {
		if (!autoOpened.current && prefs.showTwine121Startup) {
			autoOpened.current = true;
			setOpen('startScreen');
		}
	}, [prefs.showTwine121Startup]);

	const value = React.useMemo(
		() => ({
			openAiDisclaimer: () => setOpen('aiDisclaimer'),
			openStartScreen: () => setOpen('startScreen')
		}),
		[]
	);

	return (
		<StartupDialogContext.Provider value={value}>
			{children}
			{open === 'startScreen' && <StartScreen onClose={() => setOpen('none')} />}
			{open === 'aiDisclaimer' && (
				<AiDisclaimerDialog onClose={() => setOpen('none')} />
			)}
		</StartupDialogContext.Provider>
	);
};
