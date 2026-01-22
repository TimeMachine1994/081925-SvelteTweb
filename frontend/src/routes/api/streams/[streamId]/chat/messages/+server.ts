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

		// Build query for chat messages
		let query = adminDb
			.collection('streams')
			.doc(streamId)
			.collection('chat_messages')
			.orderBy('timestamp', 'desc')
			.limit(limit);

		// Apply pagination if cursor provided
		if (before) {
			console.log('📄 [CHAT API] Applying pagination before:', before);
			const beforeDoc = await adminDb
				.collection('streams')
				.doc(streamId)
				.collection('chat_messages')
				.doc(before)
				.get();
			
			if (beforeDoc.exists) {
				query = query.startAfter(beforeDoc);
			}
		}

		// Execute query
		console.log('🔍 [CHAT API] Executing Firestore query...');
		const snapshot = await query.get();
		
		console.log('✅ [CHAT API] Retrieved', snapshot.size, 'messages');

		// Process messages
		const messages: StreamChatMessage[] = [];
		snapshot.forEach(doc => {
			const data = doc.data() as StreamChatMessage;
			
			// Filter deleted messages unless admin explicitly requests them
			if (includeDeleted || !data.deleted) {
				messages.push({
					id: doc.id,
					...data
				});
			}
		});

		console.log('💬 [CHAT API] Returning', messages.length, 'messages (after filtering)');

		// Determine if there are more messages
		const hasMore = snapshot.size === limit;

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

		const messageRef = await adminDb
			.collection('streams')
			.doc(streamId)
			.collection('chat_messages')
			.add(chatMessage);

		console.log('✅ [CHAT API] Message saved to Firestore:', messageRef.id);

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
				id: messageRef.id,
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
