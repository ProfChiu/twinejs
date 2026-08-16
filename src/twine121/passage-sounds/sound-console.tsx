import {Editor} from 'codemirror';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {useTranslation} from 'react-i18next';
import {Card, CardContent} from '../../components/container/card';
import {ButtonBar} from '../../components/container/button-bar';
import {IconButton} from '../../components/control/icon-button';
import {Passage, Story} from '../../store/stories';
import {useStoryAssets} from '../assets/use-story-assets';
import {SoundAction} from './sound-snippet';
import {useAddPassageSound} from './use-add-passage-sound';
import './sound-console.css';

export interface SoundConsolePosition {
	x: number;
	y: number;
}

export interface SoundConsoleProps {
	editor?: Editor;
	onClose: () => void;
	passage: Passage;
	position: SoundConsolePosition;
	story: Story;
}

/**
 * The "Add Sound" popup form. Pick an imported sound (or import a new one),
 * choose Play/Stop, and--for Play--set loop, volume, and an optional timed
 * stop; Insert drops the matching trigger at the cursor and ensures the Howler
 * sound library is installed in Story JavaScript. Rendered via a portal into
 * document.body for the same reason as PassageImageMenu (a transformed ancestor
 * would break position:fixed math).
 */
export const SoundConsole: React.FC<SoundConsoleProps> = props => {
	const {editor, onClose, passage, position, story} = props;
	const {t} = useTranslation();
	const containerRef = React.useRef<HTMLDivElement>(null);
	const {assets, importAsset} = useStoryAssets(story);
	const {addSound} = useAddPassageSound(story);
	const sounds = assets.filter(asset => asset.kind === 'sounds');

	const [selectedName, setSelectedName] = React.useState('');
	const [action, setAction] = React.useState<SoundAction>('play');
	const [loop, setLoop] = React.useState(false);
	const [volume, setVolume] = React.useState(1);
	const [stopAfterOn, setStopAfterOn] = React.useState(false);
	const [stopAfterSec, setStopAfterSec] = React.useState(5);

	// Default the selection to the first sound once the list loads, and keep a
	// valid selection if the list changes underneath (e.g. after an import).
	React.useEffect(() => {
		if (sounds.length === 0) {
			if (selectedName !== '') {
				setSelectedName('');
			}
			return;
		}

		if (!sounds.some(sound => sound.name === selectedName)) {
			setSelectedName(sounds[0].name);
		}
	}, [sounds, selectedName]);

	React.useEffect(() => {
		function handlePointerDown(event: MouseEvent) {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				onClose();
			}
		}

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				onClose();
			}
		}

		// Capture-phase mousedown, matching PassageImageMenu--see its comment for
		// why this avoids the removeChild race a bubble-phase click can cause.
		document.addEventListener('mousedown', handlePointerDown, true);
		document.addEventListener('keydown', handleKeyDown);

		return () => {
			document.removeEventListener('mousedown', handlePointerDown, true);
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [onClose]);

	async function handleImport() {
		const imported = await importAsset('sounds');

		if (imported.length > 0) {
			setSelectedName(imported[0].name);
		}
	}

	function handleInsert() {
		const asset = sounds.find(sound => sound.name === selectedName);

		if (!asset) {
			return;
		}

		addSound(
			passage,
			{
				action,
				asset,
				options:
					action === 'play'
						? {
								loop,
								volume,
								stopAfter: stopAfterOn ? stopAfterSec : undefined
						  }
						: {}
			},
			editor
		);
		onClose();
	}

	return ReactDOM.createPortal(
		<div
			className="sound-console"
			ref={containerRef}
			style={{left: position.x, top: position.y}}
		>
			<Card floating>
				<CardContent>
					<h2 className="sound-console-title">{t('dialogs.passageEdit.addSound')}</h2>
					<div className="sound-console-field">
						<label htmlFor="sound-console-sound">
							{t('dialogs.passageEdit.addSoundSound')}
						</label>
						<div className="sound-console-sound-row">
							<select
								disabled={sounds.length === 0}
								id="sound-console-sound"
								onChange={event => setSelectedName(event.target.value)}
								value={selectedName}
							>
								{sounds.length === 0 ? (
									<option value="">
										{t('dialogs.passageEdit.addSoundNoSounds')}
									</option>
								) : (
									sounds.map(sound => (
										<option key={sound.name} value={sound.name}>
											{sound.name}
										</option>
									))
								)}
							</select>
							<IconButton
								icon={<span aria-hidden>+</span>}
								label={t('dialogs.passageEdit.addSoundImport')}
								onClick={handleImport}
							/>
						</div>
					</div>
					<div className="sound-console-field">
						<span className="sound-console-field-label">
							{t('dialogs.passageEdit.addSoundAction')}
						</span>
						<div className="sound-console-radios">
							<label>
								<input
									checked={action === 'play'}
									name="sound-console-action"
									onChange={() => setAction('play')}
									type="radio"
								/>
								{t('dialogs.passageEdit.addSoundPlay')}
							</label>
							<label>
								<input
									checked={action === 'stop'}
									name="sound-console-action"
									onChange={() => setAction('stop')}
									type="radio"
								/>
								{t('dialogs.passageEdit.addSoundStop')}
							</label>
						</div>
					</div>
					{action === 'play' && (
						<>
							<div className="sound-console-field">
								<span className="sound-console-field-label">
									{t('dialogs.passageEdit.addSoundRepeat')}
								</span>
								<div className="sound-console-radios">
									<label>
										<input
											checked={!loop}
											name="sound-console-loop"
											onChange={() => setLoop(false)}
											type="radio"
										/>
										{t('dialogs.passageEdit.addSoundOnce')}
									</label>
									<label>
										<input
											checked={loop}
											name="sound-console-loop"
											onChange={() => setLoop(true)}
											type="radio"
										/>
										{t('dialogs.passageEdit.addSoundLoop')}
									</label>
								</div>
							</div>
							<div className="sound-console-field">
								<label htmlFor="sound-console-volume">
									{t('dialogs.passageEdit.addSoundVolume')} ({volume.toFixed(2)})
								</label>
								<input
									id="sound-console-volume"
									max={1}
									min={0}
									onChange={event => setVolume(Number(event.target.value))}
									step={0.05}
									type="range"
									value={volume}
								/>
							</div>
							<div className="sound-console-field">
								<label className="sound-console-stopafter">
									<input
										checked={stopAfterOn}
										onChange={event => setStopAfterOn(event.target.checked)}
										type="checkbox"
									/>
									{t('dialogs.passageEdit.addSoundStopAfter')}
									<input
										className="sound-console-seconds"
										disabled={!stopAfterOn}
										min={1}
										onChange={event =>
											setStopAfterSec(Math.max(1, Number(event.target.value)))
										}
										type="number"
										value={stopAfterSec}
									/>
									{t('dialogs.passageEdit.addSoundSeconds')}
								</label>
							</div>
						</>
					)}
					<ButtonBar>
						<IconButton
							disabled={sounds.length === 0 || selectedName === ''}
							icon={<span aria-hidden>♪</span>}
							label={t('dialogs.passageEdit.addSoundInsert')}
							onClick={handleInsert}
							variant="primary"
						/>
					</ButtonBar>
				</CardContent>
			</Card>
		</div>,
		document.body
	);
};
