import classNames from 'classnames';
import * as React from 'react';
import ReactDOM from 'react-dom';
import {useTranslation} from 'react-i18next';
import {isElectronRenderer} from '../../util/is-electron';
import {twine121Info} from './twine121-info';
import mascotImage from './images/start-pose1.png';
import './start-screen.css';

export interface StartScreenProps {
	onClose: () => void;
}

// How long the Start button's click animation plays before the screen
// actually closes--long enough to see, short enough not to feel laggy.
const startButtonAnimationMs = 200;

interface InfoPage {
	/** Absent on the final credits page, which renders its own layout instead. */
	bodyKey?: string;
	titleKey: string;
}

/**
 * The onboarding content once shown by the standalone welcome route (removed
 * once this carried the same information)--kept as the original locale
 * strings, split into shorter pages rather than shown as long single
 * paragraphs. The autosave/browser-storage distinction is preserved from that
 * original content too, since it's real information, not decoration.
 *
 * The final page (no bodyKey) is a fixed credits card, not part of that
 * original content--see the `isLastPage` branch below.
 */
function infoPages(): InfoPage[] {
	const storageKey = isElectronRenderer() ? 'autosave' : 'browserStorage';

	return [
		{
			bodyKey: 'routes.welcome.greeting',
			titleKey: 'routes.welcome.greetingTitle'
		},
		{bodyKey: 'routes.welcome.help', titleKey: 'routes.welcome.helpTitle'},
		{
			bodyKey: `routes.welcome.${storageKey}Part1`,
			titleKey: `routes.welcome.${storageKey}Title`
		},
		{
			bodyKey: `routes.welcome.${storageKey}Part2`,
			titleKey: `routes.welcome.${storageKey}Title`
		},
		{
			bodyKey: `routes.welcome.${storageKey}Part3`,
			titleKey: `routes.welcome.${storageKey}Title`
		},
		{bodyKey: 'routes.welcome.done', titleKey: 'routes.welcome.doneTitle'},
		{titleKey: 'twine121.startScreen.credits.title'}
	];
}

/**
 * The TWINE121 start screen. Every piece of identity information here is real
 * markup driven by `twine121Info`, not an exported graphic--to change the
 * version shown at launch, edit that file. The onboarding panel pages through
 * `infoPages()` above; clicking anywhere inside that panel (including its
 * Next button and the Cookbook link on one page) never dismisses the screen,
 * since it has its own stopPropagation wrapper.
 */
export const StartScreen: React.FC<StartScreenProps> = props => {
	const {onClose} = props;
	const {t} = useTranslation();
	const [startPressed, setStartPressed] = React.useState(false);
	const [pageIndex, setPageIndex] = React.useState(0);
	const pages = React.useMemo(infoPages, []);
	const page = pages[pageIndex];
	const isLastPage = pageIndex === pages.length - 1;
	const displayRepoUrl = twine121Info.upstreamRepoUrl.replace(/^https?:\/\//, '');

	React.useEffect(() => {
		function handleKeyDown(event: KeyboardEvent) {
			if (['Enter', 'Escape', ' '].includes(event.key)) {
				event.preventDefault();
				onClose();
			}
		}

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [onClose]);

	function handleStartClick(event: React.MouseEvent) {
		// The stage's own onClick would otherwise fire too and skip the
		// animation straight to onClose.
		event.stopPropagation();

		if (startPressed) {
			return;
		}

		setStartPressed(true);
		window.setTimeout(onClose, startButtonAnimationMs);
	}

	return ReactDOM.createPortal(
		<div
			aria-label={t('twine121.startScreen.title')}
			className="twine121-start-screen"
			onClick={onClose}
			role="dialog"
		>
			<div aria-hidden className="twine121-start-screen-dots" />
			<div className="twine121-start-screen-frame">
				<div aria-hidden className="twine121-start-screen-texture" />
				<div className="twine121-start-screen-head">
					<div className="twine121-start-screen-pill-row">
						<span className="twine121-start-screen-pill">
							{t('twine121.startScreen.pillLabel')}
						</span>
					</div>
					<div className="twine121-start-screen-wordmark">
						{t('twine121.startScreen.wordmarkPrefix')}
						<span>{t('twine121.startScreen.wordmarkSuffix')}</span>
					</div>
					<p className="twine121-start-screen-subtitle">
						{t('twine121.startScreen.subtitle')}
					</p>
				</div>
				<div className="twine121-start-screen-info">
					<div
						className="twine121-start-screen-onboarding"
						// Without this, clicking the Next button or the Cookbook link
						// on one page would also reach the stage's dismiss handler.
						onClick={event => event.stopPropagation()}
					>
						<h3 className="twine121-start-screen-onboarding-title">
							{t(page.titleKey)}
						</h3>
						{page.bodyKey ? (
							<div
								className="twine121-start-screen-onboarding-body"
								dangerouslySetInnerHTML={{__html: t(page.bodyKey)}}
							/>
						) : (
							<dl className="twine121-start-screen-credits">
								<dt>{t('twine121.startScreen.credits.createdByLabel')}</dt>
								<dd>{t('twine121.startScreen.credits.createdByValue')}</dd>
								<dt>{t('twine121.startScreen.credits.versionLabel')}</dt>
								<dd>{twine121Info.version}</dd>
								<dt>{t('twine121.startScreen.credits.basedOnLabel')}</dt>
								<dd>{`Twine ${twine121Info.upstreamVersion}`}</dd>
								<dt>
									{t('twine121.startScreen.credits.originalProjectLabel')}
								</dt>
								<dd>
									<a
										href={twine121Info.upstreamRepoUrl}
										rel="noreferrer"
										target="_blank"
									>
										{displayRepoUrl}
										<span className="twine121-start-screen-visually-hidden">
											{' '}
											({t('twine121.startScreen.credits.opensInNewTabHint')})
										</span>
									</a>
								</dd>
								<dt>{t('twine121.startScreen.credits.licenseLabel')}</dt>
								<dd>{twine121Info.license}</dd>
							</dl>
						)}
						<div className="twine121-start-screen-onboarding-footer">
							<span className="twine121-start-screen-onboarding-progress">
								{pageIndex + 1} / {pages.length}
							</span>
							<button
								className="twine121-start-screen-onboarding-next"
								disabled={isLastPage}
								onClick={() =>
									setPageIndex(index => Math.min(index + 1, pages.length - 1))
								}
								type="button"
							>
								{t('common.next')}
							</button>
						</div>
					</div>
				</div>
				<div className="twine121-start-screen-cta">
					<button
						className={classNames('twine121-start-screen-start-button', {
							'is-pressed': startPressed
						})}
						onClick={handleStartClick}
						type="button"
					>
						<span aria-hidden className="twine121-start-screen-start-icon">
							▶
						</span>
						{t('twine121.startScreen.startButton')}
					</button>
				</div>
				<img
					alt={t('twine121.startScreen.imageAlt')}
					className="twine121-start-screen-mascot"
					src={mascotImage}
				/>
				<div className="twine121-start-screen-version">
					{t('twine121.startScreen.version', {version: twine121Info.version})}
				</div>
			</div>
		</div>,
		document.body
	);
};
