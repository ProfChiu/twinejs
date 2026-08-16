import classNames from 'classnames';
import {deviceType} from 'detect-it';
import * as React from 'react';
import {DraggableCore, DraggableCoreProps} from 'react-draggable';
import {useTranslation} from 'react-i18next';
import {CardContent} from '../container/card';
import {SelectableCard} from '../container/card/selectable-card';
import {Passage, TagColors} from '../../store/stories';
import {TagStripe} from '../tag/tag-stripe';
import {passageIsEmpty} from '../../util/passage-is-empty';
import './passage-card.css';
import { TagBadges } from '../tag/tag-badges';
import {
	ImageAlignment,
	PassageImageMenu,
	PassageImageMenuPosition
} from '../../twine121/passage-images';

export interface PassageCardProps {
	onEdit: (passage: Passage) => void;
	onDeselect: (passage: Passage) => void;
	onDragStart?: DraggableCoreProps['onStart'];
	onDrag?: DraggableCoreProps['onDrag'];
	onDragStop?: DraggableCoreProps['onStop'];
	onSelect: (passage: Passage, exclusive: boolean) => void;
	/** Right-click "Add Image" support--omit (or leave undefined) to disable
	 * the context menu entirely, e.g. outside Electron where there's no
	 * native file picker to back it. */
	onAddImage?: (passage: Passage, alignment: ImageAlignment) => void;
	passage: Passage;
	tagColors: TagColors;
	tagDisplay: 'color' | 'name';
}

// Needs to fill a large-sized passage card.
const excerptLength = 400;

export const PassageCard: React.FC<PassageCardProps> = React.memo(props => {
	const {
		onAddImage,
		onDeselect,
		onDrag,
		onDragStart,
		onDragStop,
		onEdit,
		onSelect,
		passage,
		tagColors,
		tagDisplay
	} = props;
	const {t} = useTranslation();
	const [imageMenuPosition, setImageMenuPosition] =
		React.useState<PassageImageMenuPosition>();
	const handleContextMenu = React.useCallback(
		(event: React.MouseEvent) => {
			if (!onAddImage) {
				return;
			}

			event.preventDefault();
			setImageMenuPosition({x: event.clientX, y: event.clientY});
		},
		[onAddImage]
	);
	const className = React.useMemo(
		() =>
			classNames('passage-card', {
				empty: passageIsEmpty(passage),
				selected: passage.selected,
				[`tag-display-${tagDisplay}`]: true
			}),
		[passage, tagDisplay]
	);
	const container = React.useRef<HTMLDivElement>(null);
	const excerpt = React.useMemo(() => {
		if (passage.text.length > 0) {
			return passage.text.substring(0, excerptLength);
		}

		return (
			<span className="placeholder">
				{t(
					deviceType === 'touchOnly'
						? 'components.passageCard.placeholderTouch'
						: 'components.passageCard.placeholderClick'
				)}
			</span>
		);
	}, [passage.text, t]);
	const style = React.useMemo(
		() => ({
			height: passage.height,
			left: passage.left,
			top: passage.top,
			width: passage.width
		}),
		[passage.height, passage.left, passage.top, passage.width]
	);
	const handleMouseDown = React.useCallback(
		(event: MouseEvent) => {
			// Shift- or control-clicking toggles our selected status, but doesn't
			// affect any other passage's selected status. If the shift or control key
			// was not held down and we were not already selected, we know the user
			// wants to select only this passage.

			if (event.shiftKey || event.ctrlKey) {
				if (passage.selected) {
					onDeselect(passage);
				} else {
					onSelect(passage, false);
				}
			} else if (!passage.selected) {
				onSelect(passage, true);
			}
		},
		[onDeselect, onSelect, passage]
	);
	const handleEdit = React.useCallback(
		() => onEdit(passage),
		[onEdit, passage]
	);
	const handleSelect = React.useCallback(
		(value: boolean, exclusive: boolean) => {
			onSelect(passage, exclusive);
		},
		[onSelect, passage]
	);

	return (
		<DraggableCore
			nodeRef={container}
			onMouseDown={handleMouseDown}
			onStart={onDragStart}
			onDrag={onDrag}
			onStop={onDragStop}
		>
			<div
				className={className}
				ref={container}
				style={style}
				data-passage-tags={passage.tags.join(' ')}
				onContextMenu={handleContextMenu}
			>
				<SelectableCard
					highlighted={passage.highlighted}
					label={passage.name}
					onDoubleClick={handleEdit}
					onSelect={handleSelect}
					selected={passage.selected}
				>
					{tagDisplay === 'color' && <TagStripe tagColors={tagColors} tags={passage.tags} />}
					<h2>{passage.name}</h2>
					<CardContent>{excerpt}</CardContent>
					{tagDisplay === 'name' && <TagBadges tagColors={tagColors} tags={passage.tags} />}
				</SelectableCard>
				{imageMenuPosition && onAddImage && (
					<PassageImageMenu
						onAddImage={onAddImage}
						onClose={() => setImageMenuPosition(undefined)}
						passage={passage}
						position={imageMenuPosition}
					/>
				)}
			</div>
		</DraggableCore>
	);
});

PassageCard.displayName = 'PassageCard';
