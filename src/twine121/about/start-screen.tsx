import classNames from 'classnames';
import * as React from 'react';
import ReactDOM from 'react-dom';
import {useTranslation} from 'react-i18next';
import {formatLastUpdated, twine121Info} from './twine121-info';
import mascotImage from './images/start-pose1.png';
import './start-screen.css';

export interface StartScreenProps {
	onClose: () => void;
}

// How long the Start button's click animation plays before the screen
// actually closes--long enough to see, short enough not to feel laggy.
const startButtonAnimationMs = 200;

/**
 * The TWINE121 start screen. Unlike the old image-based version, every piece
 * of information here is real markup driven by `twine121Info`--to change the
 * version, date, or upstream link shown at launch, edit that file, not an
 * exported graphic. To add another row (e.g. a license line), add an entry to
 * `metaRows` below and a matching label in the locale file.
 */
export const StartScreen: React.FC<StartScreenProps> = props => {
	const {onClose} = props;
	const {t} = useTranslation();
	const [startPressed, setStartPressed] = React.useState(false);

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

	const displayRepoUrl = twine121Info.upstreamRepoUrl.replace(/^https?:\/\//, '');
	const metaRows: Array<{label: string; value: React.ReactNode}> = [
		{
			label: t('twine121.startScreen.meta.versionLabel'),
			value: twine121Info.version
		},
		{
			label: t('twine121.startScreen.meta.lastUpdatedLabel'),
			value: formatLastUpdated(twine121Info.lastUpdated)
		},
		{
			label: t('twine121.startScreen.meta.basedOnLabel'),
			value: `Twine ${twine121Info.upstreamVersion}`
		},
		{
			label: t('twine121.startScreen.meta.originalProjectLabel'),
			value: (
				<a
					href={twine121Info.upstreamRepoUrl}
					// Without this the click also reaches the stage's dismiss
					// handler, so the screen would vanish as the browser takes focus.
					onClick={event => event.stopPropagation()}
					rel="noreferrer"
					target="_blank"
				>
					{displayRepoUrl}
					<span className="twine121-visually-hidden">
						{' '}
						({t('twine121.startScreen.opensInNewTabHint')})
					</span>
				</a>
			)
		}
	];

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
				</div>
				<div className="twine121-start-screen-info">
					<p className="twine121-start-screen-subtitle">
						{t('twine121.startScreen.subtitle')}
					</p>
					<dl className="twine121-start-screen-meta">
						{metaRows.map((row, index) => (
							<React.Fragment key={index}>
								<dt className="twine121-start-screen-meta-label">
									{row.label}
								</dt>
								<dd className="twine121-start-screen-meta-value">
									{row.value}
								</dd>
							</React.Fragment>
						))}
					</dl>
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
					<div className="twine121-start-screen-hint">
						{t('twine121.startScreen.clickAnywhereHint')}
					</div>
				</div>
				<img
					alt={t('twine121.startScreen.imageAlt')}
					className="twine121-start-screen-mascot"
					src={mascotImage}
				/>
			</div>
		</div>,
		document.body
	);
};
