/**
 * Stream Chat Messages API - Firestore-based
 *
 * Created: January 22, 2026
 * Handles real-time chat messaging for live streams via Firestore
 *
 * Note: Mux does not have a native chat API, so chat is stored in Firestore
 * as a subcollection under each stream document.
 *
 * Endpoints:
 * - GET: Retrieve chat messages for a stream
 * - POST: Send a new message to the chat (guests can provide userName)
 */

import { adminDb } from '$lib/server/firebase';
import {
	createStreamChatMessage,
	deleteStreamChatMessage,
	getStreamChatMessage,
	listStreamChatMessages,
	softDeleteStreamChatMessage,
	updateStreamChatMessage,
	type StreamChatMessageUpdate
} from '$lib/server/db/repos/chat';
import { error as svelteKitError, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { StreamChatMessage } from '$lib/types/chat';

console.log('💬 [CHAT API] Chat messages endpoint loaded - Firestore-based');

/**
 * GET - Retrieve chat messages for a stream
 *
 * Query params:
 * - limit: Number of messages to retrieve (default: 100)
 * - before: Pagination cursor (messageId)
 * - includeDeleted: Include deleted messages (admin only)
 */
export const GET: RequestHandler = async ({ params, url, locals }) => {
	const { streamId } = params;

	console.log('💬 [CHAT API] GET - Fetching messages for stream:', streamId);

	// Parse query parameters
	const limit = parseInt(url.searchParams.get('limit') || '100');
	const before = url.searchParams.get('before');
	const includeDeleted = url.searchParams.get('includeDeleted') === 'true';

	console.log('💬 [CHAT API] Query params:', { limit, before, includeDeleted });

	try {
		// Get stream document to verify it exists
		console.log('🔍 [CHAT API] Fetching stream document:', streamId);
		const streamDoc = await adminDb.collection('streams').doc(streamId).get();

		if (!streamDoc.exists) {
			console.log('❌ [CHAT API] Stream not found:', streamId);
			throw svelteKitError(404, 'Stream not found');
		}

		const stream = streamDoc.data();
		console.log('✅ [CHAT API] Stream found, chat enabled:', stream?.chat?.enabled);

		// Apply pagination if cursor provided
		if (before) {
			console.log('📄 [CHAT API] Applying pagination before:', before);
		}

		// Execute query
		console.log('🔍 [CHAT API] Executing Firestore query...');
		const { messages, fetched } = await listStreamChatMessages(streamId, {
			limit,
			beforeId: before,
			includeDeleted
		});

		console.log('✅ [CHAT API] Retrieved', fetched, 'messages');

		console.log('💬 [CHAT API] Returning', messages.length, 'messages (after filtering)');

		// Determine if there are more messages
		const hasMore = fetched === limit;

		return json({
			success: true,
			messages,
			hasMore,
			nextCursor: hasMore ? messages[messages.length - 1]?.id : null
		});
	} catch (error: any) {
		console.error('❌ [CHAT API] Error fetching messages:', error);
		console.error('❌ [CHAT API] Error details:', {
			message: error?.message,
			stack: error?.stack
		});

		if (error && typeof error === 'object' && 'status' in error) {
			throw error;
		}

		throw svelteKitError(500, 'Failed to fetch chat messages');
	}
};

/**
 * POST - Send a new message to the stream chat
 *
 * Request body:
 * - message: Message content (required)
 * - userName: Display name (required if not authenticated)
 * - userId: User ID (from auth, optional)
 */
export const POST: RequestHandler = async ({ params, request, locals }) => {
	const { streamId } = params;

	console.log('💬 [CHAT API] POST - Sending message to stream:', streamId);

	try {
		// Parse request body
		const body = await request.json();
		const { message, userName, userId } = body;

		console.log('💬 [CHAT API] Message details:', {
			messageLength: message?.length || 0,
			userName,
			userId: userId || 'anonymous',
			authenticated: !!locals.user
		});

		// Validate message content
		if (!message || typeof message !== 'string' || message.trim().length === 0) {
			console.log('❌ [CHAT API] Invalid message content');
			throw svelteKitError(400, 'Message content is required');
		}

		if (message.trim().length > 500) {
			console.log('❌ [CHAT API] Message too long:', message.trim().length);
			throw svelteKitError(400, 'Message must be 500 characters or less');
		}

		// Validate user name for anonymous users
		const finalUserName = userName || locals.user?.displayName || 'Anonymous';
		if (!userName && !locals.user) {
			console.log('❌ [CHAT API] No user name provided for anonymous user');
			throw svelteKitError(400, 'User name is required for anonymous users');
		}

		// Get stream document
		console.log('🔍 [CHAT API] Fetching stream document:', streamId);
		const streamDoc = await adminDb.collection('streams').doc(streamId).get();

		if (!streamDoc.exists) {
			console.log('❌ [CHAT API] Stream not found:', streamId);
			throw svelteKitError(404, 'Stream not found');
		}

		const stream = streamDoc.data();

		// Check if chat is enabled
		if (!stream?.chat?.enabled) {
			console.log('❌ [CHAT API] Chat is disabled for this stream');
			throw svelteKitError(403, 'Chat is disabled for this stream');
		}

		console.log('✅ [CHAT API] Chat is enabled for this stream');

		// Determine user role for display
		const userRole = locals.user?.role || 'guest';
		const isAdmin = userRole === 'admin';

		// Save message to Firestore
		console.log('💾 [CHAT API] Saving message to Firestore...');
		const chatMessage: Omit<StreamChatMessage, 'id'> = {
			streamId,
			userId: userId || locals.user?.uid || undefined,
			userName: finalUserName,
			userRole: isAdmin ? 'admin' : 'guest',
			isAnonymous: !userId && !locals.user,
			message: message.trim(),
			timestamp: new Date().toISOString(),
			deleted: false,
			flagged: false
		};

		const messageId = await createStreamChatMessage(streamId, chatMessage);

		console.log('✅ [CHAT API] Message saved to Firestore:', messageId);

		// Update stream chat stats
		console.log('📊 [CHAT API] Updating chat statistics...');
		await streamDoc.ref.update({
			'chat.messageCount': (stream.chat.messageCount || 0) + 1,
			updatedAt: new Date().toISOString()
		});

		console.log('✅ [CHAT API] Chat statistics updated');

		return json({
			success: true,
			message: {
				id: messageId,
				...chatMessage
			}
		});
	} catch (error: any) {
		console.error('❌ [CHAT API] Error sending message:', error);
		console.error('❌ [CHAT API] Error details:', {
			message: error?.message,
			stack: error?.stack
		});

		if (error && typeof error === 'object' && 'status' in error) {
			throw error;
		}

		throw svelteKitError(500, 'Failed to send chat message');
	}
};

/**
 * DELETE - Delete (soft-delete) a chat message
 * Requires admin, owner, or funeral director permissions
 *
 * Query params:
 * - messageId: ID of message to delete (required)
 * - permanent: If true, permanently delete instead of soft-delete (admin only)
 */
export const DELETE: RequestHandler = async ({ params, url, locals }) => {
	const { streamId } = params;
	const messageId = url.searchParams.get('messageId');
	const permanent = url.searchParams.get('permanent') === 'true';

	console.log('🗑️ [CHAT API] DELETE - Deleting message:', messageId, 'from stream:', streamId);

	// Require authentication
	if (!locals.user) {
		console.log('❌ [CHAT API] User not authenticated');
		throw svelteKitError(401, 'Authentication required');
	}

	const userId = locals.user.uid;
	console.log('🗑️ [CHAT API] User ID:', userId);
	console.log('🗑️ [CHAT API] User role:', locals.user.role);

	// Validate messageId
	if (!messageId) {
		console.log('❌ [CHAT API] No messageId provided');
		throw svelteKitError(400, 'messageId query parameter is required');
	}

	try {
		// Get stream document
		console.log('🔍 [CHAT API] Fetching stream document:', streamId);
		const streamDoc = await adminDb.collection('streams').doc(streamId).get();

		if (!streamDoc.exists) {
			console.log('❌ [CHAT API] Stream not found:', streamId);
			throw svelteKitError(404, 'Stream not found');
		}

		const stream = streamDoc.data();

		// Get memorial to check permissions
		console.log('🔍 [CHAT API] Fetching memorial document...');
		const memorialDoc = await adminDb.collection('memorials').doc(stream?.memorialId).get();

		if (!memorialDoc.exists) {
			console.log('❌ [CHAT API] Memorial not found');
			throw svelteKitError(404, 'Memorial not found');
		}

		const memorial = memorialDoc.data();

		// Check permissions (admin, owner, or funeral director)
		const hasPermission =
			locals.user.role === 'admin' ||
			memorial?.ownerUid === userId ||
			memorial?.funeralDirectorUid === userId;

		if (!hasPermission) {
			console.log('❌ [CHAT API] User lacks permission:', userId);
			throw svelteKitError(403, 'Permission denied');
		}

		console.log('✅ [CHAT API] User has permission to delete messages');

		// Get message document
		const messageDoc = await getStreamChatMessage(streamId, messageId);

		if (!messageDoc) {
			console.log('❌ [CHAT API] Message not found:', messageId);
			throw svelteKitError(404, 'Message not found');
		}

		// Permanent delete only for admins
		if (permanent) {
			if (locals.user.role !== 'admin') {
				console.log('❌ [CHAT API] Only admins can permanently delete messages');
				throw svelteKitError(403, 'Only admins can permanently delete messages');
			}

			console.log('🗑️ [CHAT API] Permanently deleting message:', messageId);
			await deleteStreamChatMessage(streamId, messageId);
			console.log('✅ [CHAT API] Message permanently deleted');

			return json({
				success: true,
				messageId,
				permanent: true,
				message: 'Message permanently deleted'
			});
		}

		// Soft-delete: mark as deleted
		console.log('🗑️ [CHAT API] Soft-deleting message:', messageId);
		await softDeleteStreamChatMessage(streamId, messageId, userId);

		console.log('✅ [CHAT API] Message soft-deleted');

		return json({
			success: true,
			messageId,
			permanent: false,
			message: 'Message deleted'
		});
	} catch (error: any) {
		console.error('❌ [CHAT API] Error deleting message:', error);
		console.error('❌ [CHAT API] Error details:', {
			message: error?.message,
			stack: error?.stack
		});

		if (error && typeof error === 'object' && 'status' in error) {
			throw error;
		}

		throw svelteKitError(500, 'Failed to delete message');
	}
};

/**
 * PATCH - Restore a soft-deleted message or update message flags
 * Requires admin, owner, or funeral director permissions
 *
 * Request body:
 * - messageId: ID of message to update (required)
 * - restore: If true, restore a soft-deleted message
 * - flagged: Set flagged status
 */
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const { streamId } = params;

	console.log('✏️ [CHAT API] PATCH - Updating message in stream:', streamId);

	// Require authentication
	if (!locals.user) {
		console.log('❌ [CHAT API] User not authenticated');
		throw svelteKitError(401, 'Authentication required');
	}

	const userId = locals.user.uid;
	console.log('✏️ [CHAT API] User ID:', userId);
	console.log('✏️ [CHAT API] User role:', locals.user.role);

	try {
		// Parse request body
		const body = await request.json();
		const { messageId, restore, flagged } = body;

		console.log('✏️ [CHAT API] Update request:', { messageId, restore, flagged });

		// Validate messageId
		if (!messageId) {
			console.log('❌ [CHAT API] No messageId provided');
			throw svelteKitError(400, 'messageId is required');
		}

		// Get stream document
		console.log('🔍 [CHAT API] Fetching stream document:', streamId);
		const streamDoc = await adminDb.collection('streams').doc(streamId).get();

		if (!streamDoc.exists) {
			console.log('❌ [CHAT API] Stream not found:', streamId);
			throw svelteKitError(404, 'Stream not found');
		}

		const stream = streamDoc.data();

		// Get memorial to check permissions
		console.log('🔍 [CHAT API] Fetching memorial document...');
		const memorialDoc = await adminDb.collection('memorials').doc(stream?.memorialId).get();

		if (!memorialDoc.exists) {
			console.log('❌ [CHAT API] Memorial not found');
			throw svelteKitError(404, 'Memorial not found');
		}

		const memorial = memorialDoc.data();

		// Check permissions
		const hasPermission =
			locals.user.role === 'admin' ||
			memorial?.ownerUid === userId ||
			memorial?.funeralDirectorUid === userId;

		if (!hasPermission) {
			console.log('❌ [CHAT API] User lacks permission:', userId);
			throw svelteKitError(403, 'Permission denied');
		}

		console.log('✅ [CHAT API] User has permission to update messages');

		// Get message document
		const messageDoc = await getStreamChatMessage(streamId, messageId);

		if (!messageDoc) {
			console.log('❌ [CHAT API] Message not found:', messageId);
			throw svelteKitError(404, 'Message not found');
		}

		// Build update object
		const updates: StreamChatMessageUpdate = {
			updatedAt: new Date().toISOString(),
			updatedBy: userId
		};

		if (restore === true) {
			updates.deleted = false;
			updates.deletedAt = null;
			updates.deletedBy = null;
			console.log('✏️ [CHAT API] Restoring message:', messageId);
		}

		if (typeof flagged === 'boolean') {
			updates.flagged = flagged;
			console.log('✏️ [CHAT API] Setting flagged to:', flagged);
		}

		// Apply updates
		await updateStreamChatMessage(streamId, messageId, updates);
		console.log('✅ [CHAT API] Message updated');

		return json({
			success: true,
			messageId,
			updates: Object.keys(updates),
			message: 'Message updated'
		});
	} catch (error: any) {
		console.error('❌ [CHAT API] Error updating message:', error);
		console.error('❌ [CHAT API] Error details:', {
			message: error?.message,
			stack: error?.stack
		});

		if (error && typeof error === 'object' && 'status' in error) {
			throw error;
		}

		throw svelteKitError(500, 'Failed to update message');
	}
};
