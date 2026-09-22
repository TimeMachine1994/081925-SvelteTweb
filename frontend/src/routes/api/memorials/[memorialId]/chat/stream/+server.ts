import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { listMemorialChatMessagesSince } from '$lib/server/db/repos/chat';

/**
 * GET /api/memorials/[memorialId]/chat/stream — SSE endpoint for realtime chat delivery.
 *
 * IMPORTANT: this is NOT a distributed pub/sub. Vercel serverless functions
 * are independent, stateless instances with no shared memory, so a POST
 * handled by one instance can't directly notify an SSE connection held open
 * by another. Instead, this handler polls Turso every ~2s from *within* the
 * single open connection and forwards any new rows as SSE events — i.e. a
 * server-side poll fanned out over one HTTP response, not true push. This
 * keeps the client simple (one EventSource, no client-side poll loop) and
 * needs no new infrastructure, at the cost of a ~2s worst-case latency and
 * one held-open function invocation per open chat panel.
 *
 * The connection is closed cleanly a little before Vercel's function
 * `maxDuration` (see `config` below) so the platform never hard-kills it
 * mid-write; the browser's native `EventSource` reconnects automatically,
 * resuming from `Last-Event-ID` (we set each event's `id` to the message's
 * `createdAt`).
 */
export const config = {
	maxDuration: 55
};

const POLL_INTERVAL_MS = 2000;
const HEARTBEAT_INTERVAL_MS = 15000;
const CONNECTION_LIFETIME_MS = 50000; // close a bit before maxDuration

export const GET: RequestHandler = async ({ params, url, request, locals }) => {
	const { memorialId } = params;

	const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();
	if (!memorialDoc.exists) throw error(404, 'Memorial not found');

	const memorialData = memorialDoc.data();
	const isPublic = memorialData?.isPublic === true;
	const userId = locals.user?.uid;
	const isOwner = memorialData?.ownerUid === userId;
	const isFuneralDirector = memorialData?.funeralDirectorUid === userId;
	const isAdmin = locals.user?.role === 'admin';

	if (!isPublic && !isOwner && !isFuneralDirector && !isAdmin) {
		throw error(403, 'You do not have permission to view this chat');
	}

	// Resume from the last event the client actually received, if reconnecting;
	// otherwise from the `since` query param (createdAt of the newest message
	// the client already has from its initial GET), or "now".
	let cursor =
		request.headers.get('last-event-id') ||
		url.searchParams.get('since') ||
		new Date().toISOString();

	const encoder = new TextEncoder();
	let pollTimer: ReturnType<typeof setInterval>;
	let heartbeatTimer: ReturnType<typeof setInterval>;
	let closeTimer: ReturnType<typeof setTimeout>;

	const stream = new ReadableStream({
		start(controller) {
			const send = (event: string, data: string, id?: string) => {
				let chunk = '';
				if (id) chunk += `id: ${id}\n`;
				chunk += `event: ${event}\ndata: ${data}\n\n`;
				controller.enqueue(encoder.encode(chunk));
			};

			// Fast client reconnect if the connection drops unexpectedly.
			controller.enqueue(encoder.encode('retry: 2000\n\n'));

			const poll = async () => {
				try {
					const messages = await listMemorialChatMessagesSince(memorialId, cursor);
					for (const message of messages) {
						send('message', JSON.stringify(message), message.createdAt);
						cursor = message.createdAt;
					}
				} catch (err) {
					console.error('[Chat SSE] Poll error:', err);
				}
			};

			pollTimer = setInterval(poll, POLL_INTERVAL_MS);
			heartbeatTimer = setInterval(() => {
				controller.enqueue(encoder.encode(': heartbeat\n\n'));
			}, HEARTBEAT_INTERVAL_MS);

			closeTimer = setTimeout(() => {
				clearInterval(pollTimer);
				clearInterval(heartbeatTimer);
				controller.close();
			}, CONNECTION_LIFETIME_MS);
		},
		cancel() {
			clearInterval(pollTimer);
			clearInterval(heartbeatTimer);
			clearTimeout(closeTimer);
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache, no-transform',
			Connection: 'keep-alive',
			'X-Accel-Buffering': 'no'
		}
	});
};
