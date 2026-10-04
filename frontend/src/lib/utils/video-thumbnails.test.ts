import { describe, it, expect } from 'vitest';
import {
	detectVideoSource,
	youTubeThumbnailUrl,
	muxThumbnailUrl,
	supportsFrameTime,
	deriveThumbnailSync
} from './video-thumbnails';

describe('detectVideoSource', () => {
	it('detects youtube from watch URLs', () => {
		expect(detectVideoSource('https://www.youtube.com/watch?v=abc123XYZ_-')).toEqual({
			kind: 'youtube',
			id: 'abc123XYZ_-',
			url: 'https://www.youtube.com/watch?v=abc123XYZ_-'
		});
	});

	it('detects youtube from youtu.be short links', () => {
		const result = detectVideoSource('https://youtu.be/abc123');
		expect(result.kind).toBe('youtube');
		expect(result.id).toBe('abc123');
	});

	it('detects youtube from embed URLs and nocookie domain', () => {
		expect(detectVideoSource('https://www.youtube.com/embed/abc123').id).toBe('abc123');
		expect(detectVideoSource('https://www.youtube-nocookie.com/embed/abc123').kind).toBe('youtube');
	});

	it('detects youtube from an iframe snippet', () => {
		const iframe = '<iframe src="https://www.youtube.com/embed/abc123" width="560" height="315"></iframe>';
		const result = detectVideoSource(iframe);
		expect(result.kind).toBe('youtube');
		expect(result.id).toBe('abc123');
	});

	it('detects vimeo from vimeo.com and player.vimeo.com', () => {
		expect(detectVideoSource('https://vimeo.com/123456789')).toEqual({
			kind: 'vimeo',
			id: '123456789',
			url: 'https://vimeo.com/123456789'
		});
		expect(detectVideoSource('https://player.vimeo.com/video/123456789').id).toBe('123456789');
	});

	it('detects mux from player/stream/image.mux.com', () => {
		expect(detectVideoSource('https://player.mux.com/abcDEF123').kind).toBe('mux');
		expect(detectVideoSource('https://stream.mux.com/abcDEF123.m3u8').id).toBe('abcDEF123');
		expect(detectVideoSource('https://image.mux.com/abcDEF123/thumbnail.png').id).toBe('abcDEF123');
	});

	it('detects direct video files by extension', () => {
		expect(detectVideoSource('https://cdn.example.com/videos/tribute.mp4').kind).toBe('file');
		expect(detectVideoSource('https://cdn.example.com/videos/tribute.webm?x=1').kind).toBe('file');
	});

	it('returns unknown for unrecognized hosts and empty input', () => {
		expect(detectVideoSource('https://example.com/something').kind).toBe('unknown');
		expect(detectVideoSource('').kind).toBe('unknown');
		expect(detectVideoSource('not a url at all').kind).toBe('unknown');
	});
});

describe('thumbnail URL builders', () => {
	it('builds a youtube thumbnail URL', () => {
		expect(youTubeThumbnailUrl('abc123')).toBe('https://img.youtube.com/vi/abc123/hqdefault.jpg');
	});

	it('builds a mux thumbnail URL with a default and custom time', () => {
		expect(muxThumbnailUrl('abc123')).toBe('https://image.mux.com/abc123/thumbnail.png?width=640&time=1');
		expect(muxThumbnailUrl('abc123', 12.5)).toBe(
			'https://image.mux.com/abc123/thumbnail.png?width=640&time=12.5'
		);
	});

	it('falls back to time=1 for invalid input', () => {
		expect(muxThumbnailUrl('abc123', -5)).toContain('time=1');
		expect(muxThumbnailUrl('abc123', NaN)).toContain('time=1');
	});
});

describe('supportsFrameTime', () => {
	it('is true only for mux and file sources', () => {
		expect(supportsFrameTime('mux')).toBe(true);
		expect(supportsFrameTime('file')).toBe(true);
		expect(supportsFrameTime('youtube')).toBe(false);
		expect(supportsFrameTime('vimeo')).toBe(false);
		expect(supportsFrameTime('unknown')).toBe(false);
	});
});

describe('deriveThumbnailSync', () => {
	it('derives for youtube and mux without network access', () => {
		expect(deriveThumbnailSync('https://youtu.be/abc123')).toBe(youTubeThumbnailUrl('abc123'));
		expect(deriveThumbnailSync('https://player.mux.com/abc123', 5)).toBe(muxThumbnailUrl('abc123', 5));
	});

	it('returns null for vimeo, file, and unknown sources', () => {
		expect(deriveThumbnailSync('https://vimeo.com/123456')).toBeNull();
		expect(deriveThumbnailSync('https://cdn.example.com/a.mp4')).toBeNull();
		expect(deriveThumbnailSync('garbage')).toBeNull();
	});
});
