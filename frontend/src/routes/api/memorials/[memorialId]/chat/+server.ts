import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import type { ChatMessage, ChatMessageInput } from '$lib/types/chat';

/**
 * GET /api/memorials/[memorialId]/chat
 * Fetch chat messages for a memorial
 */
export const GET: RequestHandler = async ({ params, url, locals }) => {
	const { memorialId } = params;

	try {
		// Get pagination parameters
		const limit = parseInt(url.searchParams.get('limit') || '50');
		const before = url.searchParams.get('before'); // Timestamp for pagination

		// Get memorial to check permissions
		const memorialRef = adminDb.collection('memorials').doc(memorialId);
		const memorialDoc = await memorialRef.get();

		if (!memorialDoc.exists) {
			throw error(404, 'Memorial not found');
		}

		const memorialData = memorialDoc.data();

		// Check if user can view chat (public memorial or has permission)
		const canView =
			memorialData?.isPublic === true ||
			locals.user?.role === 'admin' ||
			locals.user?.uid === memorialData?.ownerUid ||
			locals.user?.uid === memorialData?.creatorUid ||
			locals.user?.uid === memorialData?.funeralDirectorUid;

		if (!canView && !memorialData?.isPublic) {
			throw error(403, 'You do not have permission to view this chat');
		}

		// Build query
		let chatQuery = adminDb
			.collection('memorials')
			.doc(memorialId)
			.collection('chat')
			.where('isDeleted', '==', false)
			.orderBy('timestamp', 'desc')
			.limit(limit);

		// Add pagination if before timestamp provided
		if (before) {
			const beforeDate = new Date(before);
			chatQuery = chatQuery.startAfter(beforeDate);
		}

		const chatSnapshot = await chatQuery.get();

		const messages: ChatMessage[] = chatSnapshot.docs.map((doc) => {
			const data = doc.data();
			return {
				id: doc.id,
				memorialId,
				userId: data.userId,
				userName: data.userName,
				userRole: data.userRole,
				message: data.message,
				timestamp: data.timestamp?.toDate() || new Date(),
				isEdited: data.isEdited || false,
				editedAt: data.editedAt?.toDate(),
				isDeleted: data.isDeleted || false,
				deletedAt: data.deletedAt?.toDate(),
				deletedBy: data.deletedBy,
				replyTo: data.replyTo
			};
		});

		// Return messages in chronological order (oldest first)
		return json({
			messages: messages.reverse(),
			hasMore: chatSnapshot.docs.length === limit
		});
	} catch (err: any) {
		console.error('Error fetching chat messages:', err);
		if (err.status) throw err;
		throw error(500, 'Failed to fetch chat messages');
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
		throw error(401, 'Authentication required');
	}

	try {
		const body: ChatMessageInput = await request.json();
		const { message, replyTo } = body;

		// Validate message
		if (!message || message.trim().length === 0) {
			throw error(400, 'Message cannot be empty');
		}

		if (message.length > 500) {
			throw error(400, 'Message too long (max 500 characters)');
		}

		// Get memorial to check permissions
		const memorialRef = adminDb.collection('memorials').doc(memorialId);
		const memorialDoc = await memorialRef.get();

		if (!memorialDoc.exists) {
			throw error(404, 'Memorial not found');
		}

		const memorialData = memorialDoc.data();

		// Check if user can post (public memorial or has permission)
		const canPost =
			memorialData?.isPublic === true ||
			locals.user.role === 'admin' ||
			locals.user.uid === memorialData?.ownerUid ||
			locals.user.uid === memorialData?.creatorUid ||
			locals.user.uid === memorialData?.funeralDirectorUid;

		if (!canPost && !memorialData?.isPublic) {
			throw error(403, 'You do not have permission to post in this chat');
		}

		// Rate limiting check (simple implementation - 10 messages per minute)
		const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
		const recentMessagesSnapshot = await adminDb
			.collection('memorials')
			.doc(memorialId)
			.collection('chat')
			.where('userId', '==', locals.user.uid)
			.where('timestamp', '>', oneMinuteAgo)
			.get();

		if (recentMessagesSnapshot.size >= 10) {
			throw error(429, 'Rate limit exceeded. Please wait before sending more messages.');
		}

		// Create chat message
		const chatMessage = {
			memorialId,
			userId: locals.user.uid,
			userName: locals.user.displayName || 'Anonymous',
			userRole: locals.user.role,
			message: message.trim(),
			timestamp: new Date(),
			isEdited: false,
			isDeleted: false,
			...(replyTo && { replyTo })
		};

		const chatRef = await adminDb
			.collection('memorials')
			.doc(memorialId)
			.collection('chat')
			.add(chatMessage);

		// Return created message
		return json({
			id: chatRef.id,
			...chatMessage
		}, { status: 201 });
	} catch (err: any) {
		console.error('Error sending chat message:', err);
		if (err.status) throw err;
		throw error(500, 'Failed to send message');
	}
};
