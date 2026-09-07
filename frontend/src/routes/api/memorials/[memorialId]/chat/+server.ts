import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { createMemorialChatMessage, listMemorialChatMessages } from '$lib/server/db/repos/chat';
import type { CreateChatMessageInput } from '$lib/types/chat';

/**
 * GET /api/memorials/[memorialId]/chat
 * Fetch chat messages for a memorial
 */
export const GET: RequestHandler = async ({ params, url, locals }) => {
	const { memorialId } = params;

	try {
		// Get pagination parameters
		const limit = parseInt(url.searchParams.get('limit') || '50');
		const beforeTimestamp = url.searchParams.get('before');

		// Validate limit
		if (limit > 100) {
			throw error(400, 'Limit cannot exceed 100 messages');
		}

		// Get memorial to check if it exists and is public
		const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();

		if (!memorialDoc.exists) {
			throw error(404, 'Memorial not found');
		}

		const memorialData = memorialDoc.data();
		const isPublic = memorialData?.isPublic === true;

		// Check access permissions
		const userRole = locals.user?.role;
		const userId = locals.user?.uid;
		const isOwner = memorialData?.ownerUid === userId;
		const isFuneralDirector = memorialData?.funeralDirectorUid === userId;
		const isAdmin = userRole === 'admin';

		// Allow access if: public memorial, or user is owner/FD/admin
		if (!isPublic && !isOwner && !isFuneralDirector && !isAdmin) {
			throw error(403, 'You do not have permission to view this chat');
		}

		// Build query - simplified to avoid requiring composite index
		// We'll just order by timestamp and filter deleted messages client-side
		// Execute query - handle case where collection might not exist yet
		const fetchedMessages = await listMemorialChatMessages(memorialId, {
			limit: limit * 2, // Get more to account for deleted messages
			beforeTimestamp
		});

		if (!fetchedMessages) {
			// If the collection doesn't exist or has no documents, return empty array
			console.log('[Chat API] No messages found or collection not created yet:', memorialId);
			return json({
				messages: [],
				hasMore: false
			});
		}

		// Transform and filter messages
		const allMessages = fetchedMessages.filter((msg) => !msg.isDeleted); // Filter out deleted messages

		// Limit to requested amount after filtering
		const messages = allMessages.slice(0, limit);

		// Reverse to get chronological order (oldest first)
		messages.reverse();

		return json({
			messages,
			hasMore: messages.length === limit
		});
	} catch (err: any) {
		console.error('[Chat API] Error fetching messages:', {
			error: err,
			message: err?.message,
			code: err?.code,
			details: err?.details,
			memorialId
		});

		if (err.status) {
			throw err;
		}

		// Provide more helpful error message
		const errorMessage = err?.message || 'Failed to fetch chat messages';
		throw error(500, errorMessage);
	}
};

/**
 * POST /api/memorials/[memorialId]/chat
 * Send a new chat message
 */
export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { memorialId } = params;

	// Require authentication
	if (!locals.user) {
		throw error(401, 'You must be signed in to send messages');
	}

	try {
		const body = (await request.json()) as CreateChatMessageInput;
		const { message, replyTo } = body;

		// Validate message
		if (!message || typeof message !== 'string') {
			throw error(400, 'Message is required');
		}

		const trimmedMessage = message.trim();

		if (trimmedMessage.length === 0) {
			throw error(400, 'Message cannot be empty');
		}

		if (trimmedMessage.length > 500) {
			throw error(400, 'Message cannot exceed 500 characters');
		}

		// Get memorial to check permissions
		const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();

		if (!memorialDoc.exists) {
			throw error(404, 'Memorial not found');
		}

		const memorialData = memorialDoc.data();
		const isPublic = memorialData?.isPublic === true;

		// Check if user can post (must be public memorial or have owner/FD/admin access)
		const userRole = locals.user.role;
		const userId = locals.user.uid;
		const isOwner = memorialData?.ownerUid === userId;
		const isFuneralDirector = memorialData?.funeralDirectorUid === userId;
		const isAdmin = userRole === 'admin';

		if (!isPublic && !isOwner && !isFuneralDirector && !isAdmin) {
			throw error(403, 'You do not have permission to post in this chat');
		}

		// Create message document
		const created = await createMemorialChatMessage({
			memorialId,
			userId,
			userName: locals.user.displayName || 'Anonymous',
			userRole,
			message: trimmedMessage,
			...(replyTo && { replyTo })
		});

		// Return created message
		return json(created, { status: 201 });
	} catch (err: any) {
		console.error('[Chat API] Error sending message:', err);

		if (err.status) {
			throw err;
		}

		throw error(500, 'Failed to send message');
	}
};
