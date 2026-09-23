import { describe, it, expect } from 'vitest';
import {
	selectDisplayRecordings,
	getAvailableVodIds,
	mergeRecording,
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

	it('threads mp4Status through for both the recordings array and the legacy fallback', () => {
		const fromArray = selectDisplayRecordings({
			recordings: [rec('a', { mp4Status: 'preparing' })]
		});
		expect(fromArray[0].mp4Status).toBe('preparing');

		const fromLegacy = selectDisplayRecordings({
			vodPlaybackId: 'legacy',
			mp4Status: 'ready'
		});
		expect(fromLegacy[0].mp4Status).toBe('ready');
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

describe('mergeRecording', () => {
	it('appends when there are no existing recordings', () => {
		const result = mergeRecording(undefined, rec('a'));
		expect(result.map((r) => r.vodPlaybackId)).toEqual(['a']);
	});

	it('appends a genuinely new recording (different assetId)', () => {
		const result = mergeRecording([rec('a')], rec('b'));
		expect(result.map((r) => r.vodPlaybackId)).toEqual(['a', 'b']);
	});

	it('is a no-op when the same assetId is delivered again (webhook retry)', () => {
		const original = rec('a', { createdAt: '2026-01-01T00:00:00.000Z' });
		const retry = rec('a', { createdAt: '2026-01-01T00:05:00.000Z' }); // same assetId, later createdAt
		const result = mergeRecording([original], retry);
		expect(result).toHaveLength(1);
		expect(result[0]).toEqual(original); // keeps the original entry, doesn't overwrite with the retry
	});

	it('does not mutate the existing array', () => {
		const existing = [rec('a')];
		mergeRecording(existing, rec('b'));
		expect(existing).toHaveLength(1);
	});
});
