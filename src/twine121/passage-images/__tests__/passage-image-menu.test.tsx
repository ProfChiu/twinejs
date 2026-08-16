import {fireEvent, render, screen} from '@testing-library/react';
import {axe} from 'jest-axe';
import * as React from 'react';
import {PassageImageMenu} from '../passage-image-menu';
import {fakePassage} from '../../../test-util';

describe('<PassageImageMenu>', () => {
	function renderMenu(onAddImage = jest.fn(), onClose = jest.fn()) {
		const passage = fakePassage();

		render(
			<PassageImageMenu
				onAddImage={onAddImage}
				onClose={onClose}
				passage={passage}
				position={{x: 10, y: 20}}
			/>
		);

		return {onAddImage, onClose, passage};
	}

	it('shows all four alignment options', () => {
		renderMenu();
		expect(
			screen.getByRole('button', {
				name: 'components.passageImageMenu.anchor'
			})
		).toBeInTheDocument();
		expect(
			screen.getByRole('button', {
				name: 'components.passageImageMenu.floatLeft'
			})
		).toBeInTheDocument();
		expect(
			screen.getByRole('button', {
				name: 'components.passageImageMenu.floatRight'
			})
		).toBeInTheDocument();
		expect(
			screen.getByRole('button', {
				name: 'components.passageImageMenu.centered'
			})
		).toBeInTheDocument();
	});

	it('calls onAddImage with the passage and chosen alignment, then closes exactly once', () => {
		const {onAddImage, onClose, passage} = renderMenu();

		// A real click fires mousedown then click--exercise both, since the
		// outside-detection listens on mousedown specifically (see the
		// component: mixing that with a plain bubble-phase document click
		// listener is what caused a real "removeChild" crash when selecting
		// an option, because both paths tried to close/unmount the portaled
		// menu for the same interaction).
		const button = screen.getByRole('button', {
			name: 'components.passageImageMenu.floatLeft'
		});

		fireEvent.mouseDown(button);
		fireEvent.click(button);
		expect(onAddImage).toHaveBeenCalledWith(passage, 'float-left');
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it('closes when the mouse goes down outside the menu', () => {
		const {onClose} = renderMenu();

		fireEvent.mouseDown(document.body);
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it('does not close when the mouse goes down inside the menu (on non-button chrome)', () => {
		const {onClose} = renderMenu();

		fireEvent.mouseDown(document.querySelector('.passage-image-menu')!);
		expect(onClose).not.toHaveBeenCalled();
	});

	it('closes on Escape', () => {
		const {onClose} = renderMenu();

		fireEvent.keyDown(document, {key: 'Escape'});
		expect(onClose).toHaveBeenCalled();
	});

	it('is accessible', async () => {
		renderMenu();

		const menu = document.querySelector('.passage-image-menu') as HTMLElement;

		expect(await axe(menu)).toHaveNoViolations();
	});
});
