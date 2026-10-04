/**
 * Client-only helper to grab a still frame from a direct video file URL and
 * return it as an image Blob, for use as a Tribute Video Gallery thumbnail.
 *
 * Intentionally has no server-side equivalent: running ffmpeg in a
 * serverless function to fetch arbitrary admin-supplied URLs would add an
 * SSRF surface and is fragile under Vercel's execution limits. When the
 * source blocks frame capture (CORS taints the canvas), callers should
 * surface `VideoFrameCaptureError.reason === 'blocked'` as a prompt to
 * upload a thumbnail manually instead.
 */

export type VideoFrameCaptureReason = 'load-failed' | 'seek-timeout' | 'blocked' | 'capture-failed';

export class VideoFrameCaptureError extends Error {
	reason: VideoFrameCaptureReason;

	constructor(reason: VideoFrameCaptureReason, message: string) {
		super(message);
		this.name = 'VideoFrameCaptureError';
		this.reason = reason;
	}
}

const MAX_WIDTH = 1280;
const SEEK_TIMEOUT_MS = 10_000;

export async function captureVideoFrame(url: string, timeSec: number = 1): Promise<Blob> {
	const video = document.createElement('video');
	video.crossOrigin = 'anonymous';
	video.preload = 'metadata';
	video.muted = true;
	video.playsInline = true;
	video.src = url;

	try {
		await new Promise<void>((resolve, reject) => {
			video.addEventListener(
				'loadedmetadata',
				() => {
					const target = Math.min(Math.max(timeSec, 0), Math.max(video.duration - 0.1, 0));
					video.currentTime = Number.isFinite(target) ? target : 0;
				},
				{ once: true }
			);

			const seekTimeout = setTimeout(() => {
				reject(new VideoFrameCaptureError('seek-timeout', 'Timed out seeking the video frame'));
			}, SEEK_TIMEOUT_MS);

			video.addEventListener(
				'seeked',
				() => {
					clearTimeout(seekTimeout);
					resolve();
				},
				{ once: true }
			);

			video.addEventListener(
				'error',
				() => {
					clearTimeout(seekTimeout);
					reject(new VideoFrameCaptureError('load-failed', 'Failed to load the video for capture'));
				},
				{ once: true }
			);
		});

		const scale = video.videoWidth > MAX_WIDTH ? MAX_WIDTH / video.videoWidth : 1;
		const canvas = document.createElement('canvas');
		canvas.width = Math.round(video.videoWidth * scale) || MAX_WIDTH;
		canvas.height = Math.round(video.videoHeight * scale) || Math.round((MAX_WIDTH * 9) / 16);

		const ctx = canvas.getContext('2d');
		if (!ctx) {
			throw new VideoFrameCaptureError('capture-failed', 'Canvas 2D context unavailable');
		}
		ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

		return await new Promise<Blob>((resolve, reject) => {
			const blockedError = () =>
				new VideoFrameCaptureError(
					'blocked',
					'This video host blocks in-browser frame capture (CORS). Upload a thumbnail instead.'
				);

			try {
				canvas.toBlob(
					(blob) => {
						// Per spec, a tainted (cross-origin, non-CORS) canvas most
						// commonly resolves with a null blob rather than throwing.
						if (blob) resolve(blob);
						else reject(blockedError());
					},
					'image/jpeg',
					0.8
				);
			} catch {
				// Some engines instead throw a SecurityError synchronously.
				reject(blockedError());
			}
		});
	} finally {
		video.src = '';
		video.load();
	}
}
