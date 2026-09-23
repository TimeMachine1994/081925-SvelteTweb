/**
 * Pure helpers for "Upload & Schedule" (premiere) streams.
 *
 * A premiere stream is a pre-recorded video (`sourceType === 'upload'`) that
 * plays back seeked to the same elapsed offset for every viewer starting at
 * `scheduledStartTime`, so it feels like a live broadcast even though it's
 * technically an on-demand asset. Once its full runtime has elapsed it
 * becomes a normal, freely-seekable recording.
 *
 * Extracted from MemorialStreamDisplay.svelte / PremierePlayer.svelte so the
 * state-machine and sync math can be unit tested without rendering Svelte
 * components (mirrors the pattern used by recording-selection.ts).
 */

export interface PremiereStreamLike {
	sourceType?: 'rtmp' | 'upload';
	status?: string;
	scheduledStartTime?: string;
	recordingReady?: boolean;
	mux?: {
		duration?: number;
		recordingReady?: boolean;
		recordings?: unknown[];
	};
}

/**
 * Elapsed seconds into a premiere's runtime, given the scheduled start time
 * and the current time. Clamped to `[0, duration]` when `duration` is known;
 * otherwise clamped only at zero (uncapped upper bound).
 */
export function elapsedPremiereSeconds(
	scheduledStartTime: string,
	now: Date,
	duration?: number
): number {
	const startMs = new Date(scheduledStartTime).getTime();
	const elapsed = (now.getTime() - startMs) / 1000;
	const max = duration ?? Number.POSITIVE_INFINITY;
	return Math.min(Math.max(elapsed, 0), max);
}

/**
 * Whether an upload/premiere stream's scheduled runtime has fully elapsed
 * (i.e. it has finished "airing" and should now appear as a normal
 * recording). Requires both a scheduled start time and a known asset
 * duration — if either is missing, the premiere hasn't (knowably) aired yet.
 */
export function hasPremiereAired(
	scheduledStartTime: string | undefined,
	duration: number | undefined,
	now: Date
): boolean {
	if (!scheduledStartTime || !duration) return false;
	const startMs = new Date(scheduledStartTime).getTime();
	return now.getTime() >= startMs + duration * 1000;
}

/**
 * Whether a stream should be treated as "recorded" (its own bucket).
 * - RTMP streams: driven by status/recordingReady, same as always.
 * - Upload/premiere streams: only once its scheduled runtime has fully
 *   elapsed — NOT just because the underlying Mux asset finished
 *   processing (that can happen long before the scheduled premiere time).
 */
export function isRecordedStream(stream: PremiereStreamLike, now: Date): boolean {
	if (stream.sourceType === 'upload') {
		return hasPremiereAired(stream.scheduledStartTime, stream.mux?.duration, now);
	}
	return (
		stream.status === 'completed' ||
		stream.status === 'ended' ||
		stream.recordingReady === true ||
		stream.mux?.recordingReady === true ||
		(stream.mux?.recordings?.length ?? 0) > 0
	);
}
