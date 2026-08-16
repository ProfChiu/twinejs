import * as React from 'react';
import ReactDOM from 'react-dom';
import FocusTrap from 'focus-trap-react';
import {IconX} from '@tabler/icons';
import {IconButton} from '../../components/control/icon-button';
import {useTranslation} from 'react-i18next';
import './startup-modal.css';

export interface StartupModalProps {
	/** Imported image URL shown in the left column. */
	image: string;
	/** Alt text for that image. */
	imageAlt: string;
	/** Heading, also the accessible name of the dialog. */
	title: string;
	/** Optional line under the heading. */
	subtitle?: React.ReactNode;
	/** Buttons shown along the bottom. */
	footer?: React.ReactNode;
	onClose: () => void;
}

/**
 * The shell both Twine121 startup popups share: a centered modal over a scrim,
 * with a full-height graphic on the left and scrolling content on the right.
 *
 * This deliberately doesn't use DialogCard--that's the app's right-hand,
 * stackable, non-modal panel, which can't show a full-bleed graphic and doesn't
 * demand attention the way a startup notice should.
 */
export const StartupModal: React.FC<StartupModalProps> = props => {
	const {children, footer, image, imageAlt, onClose, subtitle, title} = props;
	const {t} = useTranslation();
	const titleId = React.useMemo(
		() => `startup-modal-title-${Math.random().toString(36).slice(2)}`,
		[]
	);

	React.useEffect(() => {
		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				onClose();
			}
		}

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [onClose]);

	return ReactDOM.createPortal(
		<div
			className="startup-modal-scrim"
			// Only a click that both starts and ends on the scrim itself closes;
			// mousedown-in-card, mouseup-on-scrim (a sloppy text selection) must not.
			onClick={event => {
				if (event.target === event.currentTarget) {
					onClose();
				}
			}}
		>
			<FocusTrap>
				<div
					aria-labelledby={titleId}
					aria-modal="true"
					className="startup-modal"
					role="dialog"
				>
					<div className="startup-modal-image">
						<img alt={imageAlt} src={image} />
					</div>
					<div className="startup-modal-body">
						<div className="startup-modal-header">
							<div className="startup-modal-titles">
								<h1 id={titleId}>{title}</h1>
								{subtitle && (
									<div className="startup-modal-subtitle">{subtitle}</div>
								)}
							</div>
							<IconButton
								icon={<IconX />}
								iconOnly
								label={t('common.close')}
								onClick={onClose}
							/>
						</div>
						<div className="startup-modal-content">{children}</div>
						{footer && <div className="startup-modal-footer">{footer}</div>}
					</div>
				</div>
			</FocusTrap>
		</div>,
		document.body
	);
};
