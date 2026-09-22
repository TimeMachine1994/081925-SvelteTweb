import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import {
	createMemorialChatMessage,
	getChatSettings,
	getLastMessageCreatedAt,
	listMemorialChatMessages
} from '$lib/server/db/repos/chat';
import type { CreateChatMessageInput } from '$lib/types/chat';

const MIN_POST_INTERVAL_MS = 3000;

/**
 * GET /api/memorials/[memorialId]/chat
 * Fetch chat history + current settings for a memorial's unified chat thread.
 */
export const GET: RequestHandler = async ({ params, url, locals }) => {
	const { memorialId } = params;

	try {
		const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
		const before = url.searchParams.get('before');

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

		const settings = await getChatSettings(memorialId);

		const fetched = await listMemorialChatMessages(memorialId, {
			limit: limit * 2,
			beforeCreatedAt: before
		});
		const visible = fetched
			.filter((m) => !m.isDeleted)
			.slice(0, limit)
			.reverse();

		return json({
			messages: visible,
			hasMore: fetched.length > limit,
			settings
		});
	} catch (err: any) {
		if (err.status) throw err;
		console.error('[Chat API] Error fetching messages:', err);
		throw error(500, err?.message || 'Failed to fetch chat messages');
	}
};

/**
 * POST /api/memorials/[memorialId]/chat
 * Send a new chat message. Works for signed-in users and anonymous guests
 * (guests must supply `guestName`).
 */
export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { memorialId } = params;

	try {
		const body = (await request.json()) as CreateChatMessageInput;
		const message = body.message?.trim();

		if (!message) throw error(400, 'Message is required');
		if (message.length > 500) throw error(400, 'Message cannot exceed 500 characters');

		const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();
		if (!memorialDoc.exists) throw error(404, 'Memorial not found');

		const memorialData = memorialDoc.data();
		const isPublic = memorialData?.isPublic === true;
		const userId = locals.user?.uid;
		const isOwner = memorialData?.ownerUid === userId;
		const isFuneralDirector = memorialData?.funeralDirectorUid === userId;
		const isAdmin = locals.user?.role === 'admin';

		if (!isPublic && !isOwner && !isFuneralDirector && !isAdmin) {
			throw error(403, 'You do not have permission to post in this chat');
		}

		const settings = await getChatSettings(memorialId);
		if (!settings.enabled) throw error(403, 'Chat is disabled for this memorial');
		if (settings.locked && !isAdmin) throw error(403, 'Chat is currently locked');

		let identity: {
			authorType: 'user' | 'guest';
			userId?: string;
			userName: string;
			userRole?: 'admin' | 'owner' | 'funeral_director' | 'viewer';
			guestSessionId?: string;
		};

		if (locals.user) {
			identity = {
				authorType: 'user',
				userId: locals.user.uid,
				userName: locals.user.displayName || 'Anonymous',
				userRole: locals.user.role
			};
		} else {
			const guestName = body.guestName?.trim();
			if (!guestName || guestName.length < 2 || guestName.length > 30) {
				throw error(400, 'A display name (2-30 characters) is required to chat as a guest');
			}
			identity = {
				authorType: 'guest',
				userName: guestName,
				guestSessionId: body.guestSessionId
			};
		}

		const lastMessageAt = await getLastMessageCreatedAt(memorialId, {
			userId: identity.userId,
			guestSessionId: identity.guestSessionId
		});
		if (lastMessageAt && Date.now() - new Date(lastMessageAt).getTime() < MIN_POST_INTERVAL_MS) {
			throw error(429, 'You are posting too quickly — please wait a moment');
		}

		const created = await createMemorialChatMessage({
			memorialId,
			...identity,
			message,
			...(body.replyTo && { replyTo: body.replyTo })
		});

		return json(created, { status: 201 });
	} catch (err: any) {
		if (err.status) throw err;
		console.error('[Chat API] Error sending message:', err);
		throw error(500, 'Failed to send message');
	}
};
