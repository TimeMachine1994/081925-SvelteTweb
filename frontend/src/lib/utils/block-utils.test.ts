import { describe, it, expect } from 'vitest';
import { addGalleryItem, removeGalleryItem, moveGalleryItem } from './block-utils';

type Item = { id: string; order: number; label: string };

function makeItems(labels: string[]): Item[] {
	return labels.map((label, order) => ({ id: label, order, label }));
}

function orderIsContiguous(items: Item[]): boolean {
	const sorted = [...items].sort((a, b) => a.order - b.order);
	return sorted.every((item, index) => item.order === index);
}

describe('gallery item order invariants', () => {
	it('keeps order contiguous after adding an item', () => {
		const items = addGalleryItem(makeItems(['a', 'b', 'c']), { id: 'd', label: 'd' });
		expect(orderIsContiguous(items)).toBe(true);
		expect(items.map((i) => i.label)).toEqual(['a', 'b', 'c', 'd']);
	});

	it('keeps order contiguous after removing an item from the middle', () => {
		const items = removeGalleryItem(makeItems(['a', 'b', 'c', 'd']), 'b');
		expect(orderIsContiguous(items)).toBe(true);
		expect(items.map((i) => i.label)).toEqual(['a', 'c', 'd']);
	});

	it('keeps order contiguous and swaps positions after moving an item up', () => {
		const items = moveGalleryItem(makeItems(['a', 'b', 'c']), 'c', 'up');
		expect(orderIsContiguous(items)).toBe(true);
		expect([...items].sort((a, b) => a.order - b.order).map((i) => i.label)).toEqual(['a', 'c', 'b']);
	});

	it('keeps order contiguous and swaps positions after moving an item down', () => {
		const items = moveGalleryItem(makeItems(['a', 'b', 'c']), 'a', 'down');
		expect(orderIsContiguous(items)).toBe(true);
		expect([...items].sort((a, b) => a.order - b.order).map((i) => i.label)).toEqual(['b', 'a', 'c']);
	});

	it('is a no-op when moving the first item up or the last item down', () => {
		const items = makeItems(['a', 'b', 'c']);
		expect(moveGalleryItem(items, 'a', 'up')).toEqual(items);
		expect(moveGalleryItem(items, 'c', 'down')).toEqual(items);
	});

	it('is a no-op when moving/removing an id that does not exist', () => {
		const items = makeItems(['a', 'b', 'c']);
		expect(moveGalleryItem(items, 'zzz', 'up')).toEqual(items);
		expect(removeGalleryItem(items, 'zzz').map((i) => i.label)).toEqual(['a', 'b', 'c']);
	});
});
