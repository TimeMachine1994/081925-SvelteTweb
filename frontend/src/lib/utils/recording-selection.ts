/**
 * Pure helpers for selecting which Mux recordings to display/publish.
 *
 * Shared by the public player (MemorialStreamDisplay) and the admin recordings
 * API so the "which recording plays" logic lives in one tested place.
 */

export interface MuxRecordingLike {
	assetId: string;
	vodPlaybackId: string;
	duration?: number;
	createdAt: string;
}

export interface MuxLike {
	recordings?: MuxRecordingLike[];
	vodPlaybackId?: string | null;
	publishedRecordings?: string[];
	assetId?: string;
}

/**
 * Resolve the ordered recordings to display for a stream.
 *
 * - If `publishedRecordings` is set, return those recordings in that order.
 * - Otherwise fall back to the latest recording (preserves prior behavior).
 * - Otherwise fall back to the legacy single `vodPlaybackId`.
 */
export function selectDisplayRecordings(mux: MuxLike | null | undefined): MuxRecordingLike[] {
	if (!mux) return [];

	const recordings = mux.recordings ?? [];
	const published = mux.publishedRecordings ?? [];

	if (published.length && recordings.length) {
		const byId = new Map(recordings.map((r) => [r.vodPlaybackId, r]));
		const selected = published
			.map((id) => byId.get(id))
			.filter((r): r is MuxRecordingLike => !!r);
		if (selected.length) return selected;
	}

	// Fallback: latest recording only
	if (recordings.length) return [recordings[recordings.length - 1]];
	if (mux.vodPlaybackId) {
		return [{ assetId: mux.assetId ?? '', vodPlaybackId: mux.vodPlaybackId, createdAt: '' }];
	}
	return [];
}

/**
 * All valid VOD playback IDs that may be published for a stream
 * (recordings array plus the legacy single field).
 */
export function getAvailableVodIds(mux: MuxLike | null | undefined): string[] {
	if (!mux) return [];
	const ids = (mux.recordings ?? []).map((r) => r.vodPlaybackId).filter(Boolean);
	if (mux.vodPlaybackId && !ids.includes(mux.vodPlaybackId)) {
		ids.push(mux.vodPlaybackId);
	}
	return ids;
}
