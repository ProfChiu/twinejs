import {IconAnchor, IconFloatCenter, IconFloatLeft, IconFloatRight} from '@tabler/icons';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {useTranslation} from 'react-i18next';
import {Card, CardContent} from '../../components/container/card';
import {ButtonBar} from '../../components/container/button-bar';
import {IconButton} from '../../components/control/icon-button';
import {Passage} from '../../store/stories';
import {ImageAlignment} from './aligned-image';
import './passage-image-menu.css';

export interface PassageImageMenuPosition {
	x: number;
	y: number;
}

export interface PassageImageMenuProps {
	onAddImage: (passage: Passage, alignment: ImageAlignment) => void;
	onClose: () => void;
	passage: Passage;
	position: PassageImageMenuPosition;
}

/**
 * A popup shown at the mouse position after right-clicking a passage card,
 * offering to add an image with a chosen alignment. Rendered via a portal
 * directly into document.body--the passage map's container has a CSS
 * transform (for zooming), and position:fixed resolves relative to the
 * nearest transformed ancestor instead of the viewport, which would make
 * position math relative to raw mouse coordinates wrong if this rendered
 * inline.
 */
export const PassageImageMenu: React.FC<PassageImageMenuProps> = props => {
	const {onAddImage, onClose, passage, position} = props;
	const {t} = useTranslation();
	const containerRef = React.useRef<HTMLDivElement>(null);

	React.useEffect(() => {
		// Capture phase, and mousedown rather than click: this must run and
		// decide whether the press was outside the menu *before* React's own
		// bubble-phase click handling reaches a button inside it. A plain
		// document.addEventListener('click', ...) at the bubble phase races
		// React's synthetic click handling for the *same* click--both can end
		// up trying to close/unmount the portaled menu at once, which throws
		// "Failed to execute 'removeChild'" (confirmed live). Checking
		// contains() here and only ever closing from one place avoids that
		// entirely: outside presses close immediately here; presses on a
		// button inside are left alone and close via that button's own
		// onClick, never both.

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

		document.addEventListener('mousedown', handlePointerDown, true);
		document.addEventListener('keydown', handleKeyDown);

		return () => {
			document.removeEventListener('mousedown', handlePointerDown, true);
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [onClose]);

	function handleSelect(alignment: ImageAlignment) {
		onAddImage(passage, alignment);
		onClose();
	}

	return ReactDOM.createPortal(
		<div
			className="passage-image-menu"
			ref={containerRef}
			style={{left: position.x, top: position.y}}
		>
			<Card floating>
				<CardContent>
					<ButtonBar orientation="vertical">
						<IconButton
							icon={<IconAnchor />}
							label={t('components.passageImageMenu.anchor')}
							onClick={() => handleSelect('anchor')}
						/>
						<IconButton
							icon={<IconFloatLeft />}
							label={t('components.passageImageMenu.floatLeft')}
							onClick={() => handleSelect('float-left')}
						/>
						<IconButton
							icon={<IconFloatRight />}
							label={t('components.passageImageMenu.floatRight')}
							onClick={() => handleSelect('float-right')}
						/>
						<IconButton
							icon={<IconFloatCenter />}
							label={t('components.passageImageMenu.centered')}
							onClick={() => handleSelect('centered')}
						/>
					</ButtonBar>
				</CardContent>
			</Card>
		</div>,
		document.body
	);
};
