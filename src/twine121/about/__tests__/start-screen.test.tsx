import {fireEvent, render, screen} from '@testing-library/react';
import {axe} from 'jest-axe';
import * as React from 'react';
import {StartScreen} from '../start-screen';
import {twine121Info} from '../twine121-info';
import {isElectronRenderer} from '../../../util/is-electron';

jest.mock('../../../util/is-electron');

describe('<StartScreen>', () => {
	const isElectronRendererMock = isElectronRenderer as jest.Mock;

	function renderComponent(onClose = jest.fn()) {
		render(<StartScreen onClose={onClose} />);
		return onClose;
	}

	beforeEach(() => isElectronRendererMock.mockReturnValue(false));

	it('shows the wordmark, subtitle, mascot, and version', () => {
		renderComponent();

		// The wordmark is split across a text node and a <span> (prefix + dimmed
		// suffix), so its full text has to be read off the element rather than
		// matched with getByText, which only matches a single element's content.
		expect(document.querySelector('.twine121-start-screen-wordmark')).toHaveTextContent(
			'twine121.startScreen.wordmarkPrefixtwine121.startScreen.wordmarkSuffix'
		);
		expect(screen.getByText('twine121.startScreen.subtitle')).toBeInTheDocument();
		expect(
			screen.getByAltText('twine121.startScreen.imageAlt')
		).toBeInTheDocument();
		expect(screen.getByText('twine121.startScreen.version')).toBeInTheDocument();
	});

	it('closes when the background is clicked', () => {
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

	describe('the onboarding panel', () => {
		it('shows the first page on open, with a 1-based progress count', () => {
			renderComponent();

			expect(
				screen.getByText('routes.welcome.greetingTitle')
			).toBeInTheDocument();
			expect(screen.getByText('routes.welcome.greeting')).toBeInTheDocument();
			expect(screen.getByText(`1 / 7`)).toBeInTheDocument();
		});

		it('shows the web browser-storage page outside Electron', () => {
			renderComponent();

			fireEvent.click(screen.getByText('common.next'));
			fireEvent.click(screen.getByText('common.next'));
			expect(
				screen.getByText('routes.welcome.browserStorageTitle')
			).toBeInTheDocument();
		});

		it('shows the autosave page inside Electron', () => {
			isElectronRendererMock.mockReturnValue(true);
			renderComponent();

			fireEvent.click(screen.getByText('common.next'));
			fireEvent.click(screen.getByText('common.next'));
			expect(
				screen.getByText('routes.welcome.autosaveTitle')
			).toBeInTheDocument();
		});

		it('advances through the "That\'s it!" page to a final credits page', () => {
			renderComponent();

			const next = () => fireEvent.click(screen.getByText('common.next'));

			next();
			expect(screen.getByText('routes.welcome.helpTitle')).toBeInTheDocument();
			next();
			next();
			next();
			next();
			expect(screen.getByText('routes.welcome.doneTitle')).toBeInTheDocument();
			expect(screen.getByText('6 / 7')).toBeInTheDocument();
			next();
			expect(
				screen.getByText('twine121.startScreen.credits.title')
			).toBeInTheDocument();
			expect(screen.getByText('7 / 7')).toBeInTheDocument();
		});

		describe('the final credits page', () => {
			function goToCreditsPage() {
				const next = () => fireEvent.click(screen.getByText('common.next'));

				for (let i = 0; i < 6; i++) {
					next();
				}
			}

			it('shows the creator, version, upstream version, license, and repo link', () => {
				renderComponent();
				goToCreditsPage();

				expect(
					screen.getByText('twine121.startScreen.credits.createdByValue')
				).toBeInTheDocument();
				expect(screen.getByText(twine121Info.version)).toBeInTheDocument();
				expect(
					screen.getByText(`Twine ${twine121Info.upstreamVersion}`)
				).toBeInTheDocument();
				expect(screen.getByText(twine121Info.license)).toBeInTheDocument();

				const link = screen.getByRole('link');

				expect(link).toHaveAttribute('href', twine121Info.upstreamRepoUrl);
				expect(link).toHaveAttribute('target', '_blank');
			});

			it('stays on the credits page and keeps Next disabled once reached', () => {
				renderComponent();
				goToCreditsPage();

				const next = screen.getByText('common.next');

				expect(next).toBeDisabled();
				fireEvent.click(next);
				expect(
					screen.getByText('twine121.startScreen.credits.title')
				).toBeInTheDocument();
				expect(screen.getByText('7 / 7')).toBeInTheDocument();
			});

			it('does not dismiss the screen when the repo link is clicked', () => {
				const onClose = renderComponent();

				goToCreditsPage();
				fireEvent.click(screen.getByRole('link'));
				expect(onClose).not.toHaveBeenCalled();
			});
		});

		it('does not dismiss the screen when clicked inside', () => {
			const onClose = renderComponent();

			fireEvent.click(screen.getByText('common.next'));
			expect(onClose).not.toHaveBeenCalled();
		});
	});

	describe('the Start button', () => {
		it('does not dismiss the screen synchronously--it animates first', () => {
			jest.useFakeTimers();

			const onClose = renderComponent();

			fireEvent.click(screen.getByRole('button', {name: /start/}));
			expect(onClose).not.toHaveBeenCalled();

			jest.runAllTimers();
			expect(onClose).toHaveBeenCalledTimes(1);
			jest.useRealTimers();
		});

		it('does not dismiss the screen twice on a double click', () => {
			jest.useFakeTimers();

			const onClose = renderComponent();
			const button = screen.getByRole('button', {name: /start/});

			fireEvent.click(button);
			fireEvent.click(button);
			jest.runAllTimers();
			expect(onClose).toHaveBeenCalledTimes(1);
			jest.useRealTimers();
		});
	});

	it('is accessible', async () => {
		// The screen portals into document.body, so `container` would be empty.
		renderComponent();
		expect(await axe(document.body)).toHaveNoViolations();
	});
});
