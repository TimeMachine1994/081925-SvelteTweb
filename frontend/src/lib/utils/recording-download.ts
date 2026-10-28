/**
 * Pure helpers for offering Mux MP4 (static rendition) downloads of
 * recordings in the admin UI.
 */

import type { Mp4Status } from '$lib/utils/recording-selection';

export type Mp4DisplayState = 'ready' | 'preparing' | 'errored' | 'unknown';

/** Make a string safe to use as part of a download filename. */
export function sanitizeFilenamePart(value: string | null | undefined): string {
	return (value ?? '')
		.replace(/[/\\:*?"<>|]/g, '')
		.trim()
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^[-.]+|[-.]+$/g, '');
}

export function buildRecordingFilename(opts: {
	memorialName?: string | null;
	streamTitle?: string | null;
	sessionNumber: number;
}): string {
	const parts = [sanitizeFilenamePart(opts.memorialName), sanitizeFilenamePart(opts.streamTitle)].filter(
		Boolean
	);
	const base = parts.length ? parts.join('-') : 'recording';
	return `${base}-session-${opts.sessionNumber}.mp4`;
}

export function buildMp4DownloadUrl(vodPlaybackId: string, filename: string): string {
	return `https://stream.mux.com/${vodPlaybackId}/high.mp4?download=${encodeURIComponent(filename)}`;
}

/**
 * How a recording's MP4 should be presented. A recording with an asset but no
 * recorded status is treated as still preparing (it will be checked); without
 * an asset ID its status can't be determined.
 */
export function mp4DisplayState(
	status: Mp4Status | 'unknown' | null | undefined,
	hasAssetId: boolean
): Mp4DisplayState {
	if (status === 'ready' || status === 'errored') return status;
	if (!hasAssetId || status === 'unknown') return 'unknown';
	return 'preparing';
}

export function needsMp4StatusCheck(status: Mp4Status | null | undefined, hasAssetId: boolean): boolean {
	return hasAssetId && status !== 'ready' && status !== 'errored';
}
