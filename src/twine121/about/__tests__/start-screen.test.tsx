import {fireEvent, render, screen} from '@testing-library/react';
import {axe} from 'jest-axe';
import * as React from 'react';
import {StartScreen} from '../start-screen';
import {twine121Info} from '../twine121-info';

describe('<StartScreen>', () => {
	function renderComponent(onClose = jest.fn()) {
		render(<StartScreen onClose={onClose} />);
		return onClose;
	}

	it('shows the start artwork with alt text', () => {
		renderComponent();
		expect(
			screen.getByAltText('twine121.startScreen.imageAlt')
		).toBeInTheDocument();
	});

	it('closes when clicked anywhere', () => {
		const onClose = renderComponent();

		fireEvent.click(screen.getByRole('dialog'));
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it.each([['Escape'], ['Enter'], [' ']])(
		'closes when %s is pressed',
		key => {
			const onClose = renderComponent();

			fireEvent.keyDown(document, {key});
			expect(onClose).toHaveBeenCalledTimes(1);
		}
	);

	describe('the GitHub link hotspot', () => {
		it('links to the upstream repo in a new window', () => {
			renderComponent();

			const link = screen.getByRole('link');

			expect(link).toHaveAttribute('href', twine121Info.upstreamRepoUrl);
			expect(link).toHaveAttribute('target', '_blank');
		});

		it('is positioned over the link drawn into the artwork', () => {
			renderComponent();

			// Percentages, so the hotspot tracks the text at any displayed size.
			const {height, left, top, width} = screen.getByRole('link').style;

			for (const value of [height, left, top, width]) {
				expect(value).toMatch(/%$/);
			}
		});

		it('does not dismiss the screen when clicked', () => {
			const onClose = renderComponent();

			fireEvent.click(screen.getByRole('link'));
			expect(onClose).not.toHaveBeenCalled();
		});
	});

	it('is accessible', async () => {
		// The screen portals into document.body, so `container` would be empty.
		renderComponent();
		expect(await axe(document.body)).toHaveNoViolations();
	});
});
