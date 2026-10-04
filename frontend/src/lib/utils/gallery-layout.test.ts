import { describe, it, expect } from 'vitest';
import { masonryColumnCount, masonryColumnWidth, masonrySpan, MASONRY_GAP, MASONRY_ROW_UNIT } from './gallery-layout';

describe('masonryColumnCount', () => {
	it('returns 1 column below 640px', () => {
		expect(masonryColumnCount(0)).toBe(1);
		expect(masonryColumnCount(375)).toBe(1);
		expect(masonryColumnCount(639)).toBe(1);
	});

	it('returns 2 columns between 640 and 1024', () => {
		expect(masonryColumnCount(640)).toBe(2);
		expect(masonryColumnCount(800)).toBe(2);
		expect(masonryColumnCount(1023)).toBe(2);
	});

	it('returns 3 columns at 1024 and above', () => {
		expect(masonryColumnCount(1024)).toBe(3);
		expect(masonryColumnCount(1920)).toBe(3);
	});
});

describe('masonryColumnWidth', () => {
	it('divides the container evenly minus gaps', () => {
		// 1000px wide, 3 columns, 12px gap -> (1000 - 24) / 3
		expect(masonryColumnWidth(1000, 3, 12)).toBeCloseTo((1000 - 24) / 3);
	});

	it('returns the full width for a single column', () => {
		expect(masonryColumnWidth(500, 1, 12)).toBe(500);
	});

	it('handles zero/negative columns defensively', () => {
		expect(masonryColumnWidth(500, 0)).toBe(500);
	});
});

describe('masonrySpan', () => {
	it('computes a span proportional to aspect ratio', () => {
		const square = masonrySpan(300, 1); // 1:1
		const portrait = masonrySpan(300, 1.5); // taller than wide
		const landscape = masonrySpan(300, 0.5); // wider than tall
		expect(portrait).toBeGreaterThan(square);
		expect(square).toBeGreaterThan(landscape);
	});

	it('matches the expected rounding for a known case', () => {
		// width 300, ratio 0.75 (4:3) -> height 225 + gap 12 = 237 / 8 = 29.625 -> 30
		expect(masonrySpan(300, 0.75, MASONRY_GAP, MASONRY_ROW_UNIT)).toBe(30);
	});

	it('never returns less than 1', () => {
		expect(masonrySpan(0, 1)).toBe(1);
		expect(masonrySpan(-10, 1)).toBe(1);
	});

	it('falls back to 1 for invalid aspect ratios', () => {
		expect(masonrySpan(300, 0)).toBe(1);
		expect(masonrySpan(300, -1)).toBe(1);
		expect(masonrySpan(300, NaN)).toBe(1);
	});
});
