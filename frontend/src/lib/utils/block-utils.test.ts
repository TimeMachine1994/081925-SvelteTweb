import { describe, it, expect } from 'vitest';
import { getEmbedDisplayTitle } from './block-utils';

describe('getEmbedDisplayTitle', () => {
	it('returns an empty string for undefined', () => {
		expect(getEmbedDisplayTitle(undefined)).toBe('');
	});

	it('returns an empty string for an empty string', () => {
		expect(getEmbedDisplayTitle('')).toBe('');
	});

	it('returns an empty string for whitespace only', () => {
		expect(getEmbedDisplayTitle('   ')).toBe('');
	});

	it('treats the legacy auto-default "Embed" as no title', () => {
		expect(getEmbedDisplayTitle('Embed')).toBe('');
	});

	it('treats "Embed" with surrounding whitespace as no title', () => {
		expect(getEmbedDisplayTitle(' Embed ')).toBe('');
	});

	it('returns a trimmed custom title', () => {
		expect(getEmbedDisplayTitle(' Funeral Service ')).toBe('Funeral Service');
	});
});
