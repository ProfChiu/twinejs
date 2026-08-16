import {isChapbookFormat} from '../format';

describe('isChapbookFormat', () => {
	it('is true for "Chapbook"', () => expect(isChapbookFormat('Chapbook')).toBe(true));
	it('is true regardless of case', () =>
		expect(isChapbookFormat('chapbook')).toBe(true));
	it('is false for "Harlowe"', () => expect(isChapbookFormat('Harlowe')).toBe(false));
});
