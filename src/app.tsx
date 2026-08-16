import * as React from 'react';
import {GlobalErrorBoundary} from './components/error';
import {LoadingCurtain} from './components/loading-curtain/loading-curtain';
import {LocaleSwitcher} from './store/locale-switcher';
import {PrefsContextProvider} from './store/prefs';
import {Routes} from './routes';
import {StoriesContextProvider} from './store/stories';
import {StoryFormatsContextProvider} from './store/story-formats';
import {StateLoader} from './store/state-loader';
import {ThemeSetter} from './store/theme-setter';
import {StartupDialogProvider} from './twine121/about';
import './styles/typography.css';

export const App: React.FC = () => (
	<GlobalErrorBoundary>
		<PrefsContextProvider>
			<LocaleSwitcher />
			<ThemeSetter />
			<StoryFormatsContextProvider>
				<StoriesContextProvider>
					<StateLoader>
						{/* The provider must be inside the Suspense boundary--its dialogs
						use useTranslation(), which suspends until locales load. It stays
						above the router so it mounts once per launch. */}
						<React.Suspense fallback={<LoadingCurtain />}>
							<StartupDialogProvider>
								<Routes />
							</StartupDialogProvider>
						</React.Suspense>
					</StateLoader>
				</StoriesContextProvider>
			</StoryFormatsContextProvider>
		</PrefsContextProvider>
	</GlobalErrorBoundary>
);
