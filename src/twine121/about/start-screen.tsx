import * as React from 'react';
import ReactDOM from 'react-dom';
import {useTranslation} from 'react-i18next';
import {twine121Info} from './twine121-info';
import startImage from './images/start.png';
import './start-screen.css';

export interface StartScreenProps {
	onClose: () => void;
}

/**
 * Hotspot over the `github.com/klembot/twinejs` link drawn into start.png,
 * measured from the artwork and expressed as percentages of it, so it stays on
 * the text at any size the image is displayed at. Re-measure if the artwork's
 * layout changes--a straight re-export at a higher resolution doesn't affect
 * these numbers.
 */
const linkHotspot = {
	left: '70.5%',
	top: '58.7%',
	width: '18.6%',
	height: '4.6%'
};

/**
 * The TWINE121 start screen: the artwork in `start.png`, full-window, dismissed
 * by clicking anywhere. Its text--version, dates, the project link--is part of
 * the image rather than markup, so the only interactive area besides
 * "click anywhere" is the hotspot over the GitHub link.
 *
 * Because the version is drawn into the artwork, `start.png` has to be
 * re-exported when it changes. See `twine121-info.ts`.
 */
export const StartScreen: React.FC<StartScreenProps> = props => {
	const {onClose} = props;
	const {t} = useTranslation();

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

	return ReactDOM.createPortal(
		<div
			aria-label={t('twine121.startScreen.title')}
			className="twine121-start-screen"
			onClick={onClose}
			role="dialog"
		>
			<div className="twine121-start-screen-art">
				<img alt={t('twine121.startScreen.imageAlt')} src={startImage} />
				<a
					className="twine121-start-screen-hotspot"
					href={twine121Info.upstreamRepoUrl}
					// Without this the click also reaches the dismiss handler above, so
					// the screen would vanish as the browser takes focus.
					onClick={event => event.stopPropagation()}
					rel="noreferrer"
					style={linkHotspot}
					target="_blank"
				>
					<span>{t('twine121.startScreen.repoLinkLabel')}</span>
				</a>
			</div>
		</div>,
		document.body
	);
};
