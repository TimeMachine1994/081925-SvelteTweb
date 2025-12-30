import type { RequestHandler } from './$types';
import { journeyWatcher } from '$lib/server/journey-watcher';
import path from 'path';

export const GET: RequestHandler = async () => {
	// Initialize watcher if not already done
	const journeysDir = path.join(process.cwd(), 'journeys');
	journeyWatcher.init(journeysDir);

	let isClosed = false;
	let unsubscribe: (() => void) | null = null;
	let heartbeat: ReturnType<typeof setInterval> | null = null;

	const cleanup = () => {
		isClosed = true;
		if (unsubscribe) unsubscribe();
		if (heartbeat) clearInterval(heartbeat);
		console.log('[SSE] Client disconnected from journey updates');
	};

	const stream = new ReadableStream({
		start(controller) {
			// Send initial connection message
			const connectMsg = `data: ${JSON.stringify({ type: 'connected' })}\n\n`;
			controller.enqueue(new TextEncoder().encode(connectMsg));

			// Add listener for file changes
			unsubscribe = journeyWatcher.addListener((event, filePath) => {
				if (isClosed) return;
				try {
					const data = {
						type: 'change',
						event,
						file: path.basename(filePath),
						timestamp: Date.now()
					};
					const message = `data: ${JSON.stringify(data)}\n\n`;
					controller.enqueue(new TextEncoder().encode(message));
				} catch {
					cleanup();
				}
			});

			// Send heartbeat every 30 seconds to keep connection alive
			heartbeat = setInterval(() => {
				if (isClosed) return;
				try {
					const ping = `data: ${JSON.stringify({ type: 'ping' })}\n\n`;
					controller.enqueue(new TextEncoder().encode(ping));
				} catch {
					cleanup();
				}
			}, 30000);
		},
		cancel() {
			cleanup();
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			'Connection': 'keep-alive'
		}
	});
};
