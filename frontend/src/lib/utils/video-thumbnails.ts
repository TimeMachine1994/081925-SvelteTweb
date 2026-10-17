/**
 * Video Thumbnail Utilities
 *
 * Pure helpers for identifying a tribute-video-gallery item's source
 * platform and deriving a thumbnail URL for it. Kept free of network calls
 * and DOM access so it can run on both the public renderer (sync-only path)
 * and the admin editor (which layers network/canvas-based derivation on
 * top via video-thumbnails + video-frame-capture + the Vimeo API route).
 */

export type VideoSourceKind = 'youtube' | 'vimeo' | 'mux' | 'file' | 'unknown';

export interface DetectedVideoSource {
	kind: VideoSourceKind;
	/** Platform video/playback id, when applicable (youtube, vimeo, mux). */
	id?: string;
	/** The resolved URL the id/kind was extracted from. */
	url?: string;
}

const VIDEO_FILE_EXTENSIONS = /\.(mp4|webm|mov|m4v)(\?.*)?$/i;

/**
 * Pull the first http(s) URL out of an embed code. If the code is already a
 * bare URL (no `<`), it's returned as-is. If it's an iframe/embed snippet,
 * the `src="..."` attribute is extracted.
 */
function extractUrl(embedCode: string): string | null {
	const trimmed = embedCode.trim();
	if (!trimmed) return null;

	if (!trimmed.includes('<')) {
		return trimmed.startsWith('http') ? trimmed : null;
	}

	const match = trimmed.match(/src=["']([^"']+)["']/);
	return match ? match[1] : null;
}

/**
 * Identify the video platform (and its id, where relevant) referenced by an
 * embed code or bare URL. Order matters: Mux is checked before the generic
 * file-extension check since Mux URLs never end in a known video extension
 * but we still want them classified as 'mux', not 'unknown'.
 */
export function detectVideoSource(embedCode: string): DetectedVideoSource {
	const url = extractUrl(embedCode);
	if (!url) return { kind: 'unknown' };

	let parsed: URL;
	try {
		parsed = new URL(url);
	} catch {
		return { kind: 'unknown', url };
	}

	const host = parsed.hostname.replace(/^www\./, '');
	const path = parsed.pathname;

	// YouTube
	if (host === 'youtu.be') {
		const id = path.slice(1).split('/')[0];
		if (id) return { kind: 'youtube', id, url };
	}
	if (host === 'youtube.com' || host === 'youtube-nocookie.com' || host === 'm.youtube.com') {
		if (path.startsWith('/embed/')) {
			const id = path.split('/embed/')[1]?.split('/')[0];
			if (id) return { kind: 'youtube', id, url };
		}
		const vParam = parsed.searchParams.get('v');
		if (vParam) return { kind: 'youtube', id: vParam, url };
	}

	// Vimeo
	if (host === 'vimeo.com') {
		const id = path.split('/').filter(Boolean)[0];
		if (id && /^\d+$/.test(id)) return { kind: 'vimeo', id, url };
	}
	if (host === 'player.vimeo.com') {
		const match = path.match(/\/video\/(\d+)/);
		if (match) return { kind: 'vimeo', id: match[1], url };
	}

	// Mux
	if (host === 'player.mux.com') {
		const id = path.split('/').filter(Boolean)[0];
		if (id) return { kind: 'mux', id, url };
	}
	if (host === 'stream.mux.com' || host === 'image.mux.com') {
		const id = path.split('/').filter(Boolean)[0]?.replace(/\.(m3u8|png|jpg|mp4)$/, '');
		if (id) return { kind: 'mux', id, url };
	}

	// Direct video file
	if (VIDEO_FILE_EXTENSIONS.test(path)) {
		return { kind: 'file', url };
	}

	return { kind: 'unknown', url };
}

/** Static YouTube thumbnail URL — no network call, no API key required. */
export function youTubeThumbnailUrl(id: string): string {
	return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

/**
 * Mux's on-the-fly thumbnail image API. `timeSec` selects which frame of the
 * asset to render; defaults to 1s in to avoid a common black first frame.
 */
export function muxThumbnailUrl(id: string, timeSec: number = 1): string {
	const t = Number.isFinite(timeSec) && timeSec >= 0 ? timeSec : 1;
	return `https://image.mux.com/${id}/thumbnail.png?width=640&time=${t}`;
}

/** Whether an admin-adjustable capture time is meaningful for this source. */
export function supportsFrameTime(kind: VideoSourceKind): boolean {
	return kind === 'mux' || kind === 'file';
}

/**
 * Best-effort, network-free thumbnail derivation. Covers YouTube and Mux
 * (both have predictable, static image URLs); Vimeo requires an oEmbed
 * lookup and direct files require in-browser frame capture, so both return
 * null here — callers needing those fall back to the admin-only async paths
 * (`$lib/utils/video-frame-capture` and the `/api/admin/video-thumbnail`
 * route) or to a generic placeholder.
 */
export function deriveThumbnailSync(embedCode: string, timeSec?: number): string | null {
	const source = detectVideoSource(embedCode);
	switch (source.kind) {
		case 'youtube':
			return source.id ? youTubeThumbnailUrl(source.id) : null;
		case 'mux':
			return source.id ? muxThumbnailUrl(source.id, timeSec) : null;
		default:
			return null;
	}
}
