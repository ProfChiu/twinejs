import * as React from 'react';
import {useTranslation} from 'react-i18next';
import {IconArrowLeft, IconCheck} from '@tabler/icons';
import {ButtonBar} from '../../components/container/button-bar';
import {IconButton} from '../../components/control/icon-button';
import {StartupModal} from './startup-modal';
import startNurse from './images/start-nurse.png';

export interface AiDisclaimerDialogProps {
	/**
	 * If given, a Back button appears--used when this was opened from the startup
	 * dialog, so the reader can return to it.
	 */
	onBack?: () => void;
	onClose: () => void;
}

export const AiDisclaimerDialog: React.FC<AiDisclaimerDialogProps> = props => {
	const {onBack, onClose} = props;
	const {t} = useTranslation();
	const builtWith = t('twine121.aiDisclaimer.builtWithList', {
		returnObjects: true
	}) as string[];

	return (
		<StartupModal
			footer={
				<ButtonBar>
					{onBack && (
						<IconButton
							icon={<IconArrowLeft />}
							label={t('common.back')}
							onClick={onBack}
						/>
					)}
					<IconButton
						icon={<IconCheck />}
						label={t('twine121.aiDisclaimer.gotIt')}
						onClick={onClose}
						variant="primary"
					/>
				</ButtonBar>
			}
			image={startNurse}
			imageAlt={t('twine121.aiDisclaimer.imageAlt')}
			onClose={onClose}
			subtitle={t('twine121.aiDisclaimer.subtitle')}
			title={t('twine121.aiDisclaimer.title')}
		>
			<h2>{t('twine121.aiDisclaimer.whatIsThisHeader')}</h2>
			<p>{t('twine121.aiDisclaimer.whatIsThis')}</p>
			<h2>{t('twine121.aiDisclaimer.builtWithHeader')}</h2>
			<p>{t('twine121.aiDisclaimer.builtWith')}</p>
			<ul>
				{/* Array.isArray guards against a locale file that supplies a string. */}
				{(Array.isArray(builtWith) ? builtWith : []).map(item => (
					<li key={item}>{item}</li>
				))}
			</ul>
			<h2>{t('twine121.aiDisclaimer.howHeader')}</h2>
			<p>{t('twine121.aiDisclaimer.how')}</p>
			<h2>{t('twine121.aiDisclaimer.accountabilityHeader')}</h2>
			<p>{t('twine121.aiDisclaimer.accountability')}</p>
			<h2>{t('twine121.aiDisclaimer.whyHeader')}</h2>
			<p>{t('twine121.aiDisclaimer.why')}</p>
		</StartupModal>
	);
};
