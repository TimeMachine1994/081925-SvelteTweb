import { describe, it, expect } from 'vitest';
import {
	selectDisplayRecordings,
	getAvailableVodIds,
	type MuxLike,
	type MuxRecordingLike
} from './recording-selection';

const rec = (vodPlaybackId: string, extra: Partial<MuxRecordingLike> = {}) => ({
	assetId: `asset-${vodPlaybackId}`,
	vodPlaybackId,
	createdAt: '2026-01-01T00:00:00.000Z',
	...extra
});

describe('selectDisplayRecordings', () => {
	it('returns [] for null/undefined/empty mux', () => {
		expect(selectDisplayRecordings(null)).toEqual([]);
		expect(selectDisplayRecordings(undefined)).toEqual([]);
		expect(selectDisplayRecordings({})).toEqual([]);
	});

	it('falls back to the latest recording when no selection (preserves prior behavior)', () => {
		const mux: MuxLike = { recordings: [rec('a'), rec('b'), rec('c')] };
		expect(selectDisplayRecordings(mux).map((r) => r.vodPlaybackId)).toEqual(['c']);
	});

	it('falls back to the legacy single vodPlaybackId when no recordings', () => {
		const mux: MuxLike = { vodPlaybackId: 'legacy', assetId: 'legacy-asset' };
		const out = selectDisplayRecordings(mux);
		expect(out).toHaveLength(1);
		expect(out[0].vodPlaybackId).toBe('legacy');
		expect(out[0].assetId).toBe('legacy-asset');
	});

	it('honors a single published selection over the latest', () => {
		const mux: MuxLike = {
			recordings: [rec('a'), rec('b'), rec('c')],
			publishedRecordings: ['a']
		};
		expect(selectDisplayRecordings(mux).map((r) => r.vodPlaybackId)).toEqual(['a']);
	});

	it('honors multiple published selections in the given order', () => {
		const mux: MuxLike = {
			recordings: [rec('a'), rec('b'), rec('c')],
			publishedRecordings: ['c', 'a']
		};
		expect(selectDisplayRecordings(mux).map((r) => r.vodPlaybackId)).toEqual(['c', 'a']);
	});

	it('ignores published ids that no longer exist, keeping valid ones', () => {
		const mux: MuxLike = {
			recordings: [rec('a'), rec('b')],
			publishedRecordings: ['ghost', 'b']
		};
		expect(selectDisplayRecordings(mux).map((r) => r.vodPlaybackId)).toEqual(['b']);
	});

	it('falls back to latest when all published ids are invalid', () => {
		const mux: MuxLike = {
			recordings: [rec('a'), rec('b')],
			publishedRecordings: ['ghost1', 'ghost2']
		};
		expect(selectDisplayRecordings(mux).map((r) => r.vodPlaybackId)).toEqual(['b']);
	});

	it('models the Douglas Service stream: pins the real May-1 recording', () => {
		// recordings[1] (latest, 2.34s June-2 reconnect) is the "wrong" video.
		const mux: MuxLike = {
			recordings: [
				rec('Fj801c02diQ8CZ7Op7C3500DBgNUphC01012w01AFXOiZObHQ', { duration: 11.8453 }),
				rec('4TBTDAkjS5fUsCQCck02hgYwvCfnp6PNc1EHORAUX01Yk', { duration: 2.34 })
			],
			vodPlaybackId: '4TBTDAkjS5fUsCQCck02hgYwvCfnp6PNc1EHORAUX01Yk',
			publishedRecordings: ['Fj801c02diQ8CZ7Op7C3500DBgNUphC01012w01AFXOiZObHQ']
		};
		const out = selectDisplayRecordings(mux);
		expect(out).toHaveLength(1);
		expect(out[0].duration).toBe(11.8453);
	});
});

describe('getAvailableVodIds', () => {
	it('returns [] for null/undefined/empty', () => {
		expect(getAvailableVodIds(null)).toEqual([]);
		expect(getAvailableVodIds(undefined)).toEqual([]);
		expect(getAvailableVodIds({})).toEqual([]);
	});

	it('collects ids from the recordings array', () => {
		const mux: MuxLike = { recordings: [rec('a'), rec('b')] };
		expect(getAvailableVodIds(mux)).toEqual(['a', 'b']);
	});

	it('includes the legacy vodPlaybackId without duplicating', () => {
		expect(getAvailableVodIds({ recordings: [rec('a')], vodPlaybackId: 'b' })).toEqual(['a', 'b']);
		expect(getAvailableVodIds({ recordings: [rec('a')], vodPlaybackId: 'a' })).toEqual(['a']);
	});
});
