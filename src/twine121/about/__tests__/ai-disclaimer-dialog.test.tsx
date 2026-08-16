import {fireEvent, render, screen} from '@testing-library/react';
import {axe} from 'jest-axe';
import * as fs from 'fs';
import * as path from 'path';
import * as React from 'react';
import {AiDisclaimerDialog} from '../ai-disclaimer-dialog';

describe('<AiDisclaimerDialog>', () => {
	it('shows the disclaimer sections', () => {
		render(<AiDisclaimerDialog onClose={jest.fn()} />);

		for (const key of [
			'whatIsThis',
			'builtWith',
			'how',
			'accountability',
			'why'
		]) {
			expect(
				screen.getByText(`twine121.aiDisclaimer.${key}Header`)
			).toBeInTheDocument();
			expect(
				screen.getByText(`twine121.aiDisclaimer.${key}`)
			).toBeInTheDocument();
		}
	});

	it('calls onClose when Got It is clicked', () => {
		const onClose = jest.fn();

		render(<AiDisclaimerDialog onClose={onClose} />);
		fireEvent.click(screen.getByText('twine121.aiDisclaimer.gotIt'));
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it('shows a Back button only when onBack is given', () => {
		const {unmount} = render(<AiDisclaimerDialog onClose={jest.fn()} />);

		expect(screen.queryByText('common.back')).not.toBeInTheDocument();
		unmount();

		const onBack = jest.fn();

		render(<AiDisclaimerDialog onBack={onBack} onClose={jest.fn()} />);
		fireEvent.click(screen.getByText('common.back'));
		expect(onBack).toHaveBeenCalledTimes(1);
	});

	it('is accessible', async () => {
		// The modal portals into document.body, so `container` would be empty.
		render(<AiDisclaimerDialog onClose={jest.fn()} />);
		expect(await axe(document.body)).toHaveNoViolations();
	});
});

describe('Twine121 startup locale strings', () => {
	// react-i18next is mocked to echo keys back, so nothing else in these tests
	// would notice a key that doesn't exist in the locale file.
	const locale = JSON.parse(
		fs.readFileSync(
			path.join(__dirname, '../../../../public/locales/en-US.json'),
			'utf8'
		)
	);

	function keysUsedIn(file: string) {
		const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

		return Array.from(source.matchAll(/t\('(twine121\.[^']+)'/g)).map(
			match => match[1]
		);
	}

	it.each(['ai-disclaimer-dialog.tsx', 'start-screen.tsx'])(
		'has every key used by %s',
		file => {
			const keys = keysUsedIn(file);

			expect(keys.length).toBeGreaterThan(0);

			for (const key of keys) {
				const value = key
					.split('.')
					.reduce((result, part) => result?.[part], locale);

				expect([key, value]).not.toEqual([key, undefined]);
			}
		}
	);

	it('has the AI disclaimer bullet list as an array of strings', () => {
		const list = locale.twine121.aiDisclaimer.builtWithList;

		expect(Array.isArray(list)).toBe(true);
		expect(list.length).toBeGreaterThan(0);
		expect(list.every((item: unknown) => typeof item === 'string')).toBe(true);
	});
});
