import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import type { ChatMessageEdit } from '$lib/types/chat';

/**
 * PUT /api/memorials/[memorialId]/chat/[chatId]
 * Edit a chat message (user can only edit their own messages)
 */
export const PUT: RequestHandler = async ({ params, request, locals }) => {
	const { memorialId, chatId } = params;

	// Require authentication
	if (!locals.user) {
		throw error(401, 'Authentication required');
	}

	try {
		const body: ChatMessageEdit = await request.json();
		const { message } = body;

		// Validate message
		if (!message || message.trim().length === 0) {
			throw error(400, 'Message cannot be empty');
		}

		if (message.length > 500) {
			throw error(400, 'Message too long (max 500 characters)');
		}

		// Get the message
		const messageRef = adminDb
			.collection('memorials')
			.doc(memorialId)
			.collection('chat')
			.doc(chatId);

		const messageDoc = await messageRef.get();

		if (!messageDoc.exists) {
			throw error(404, 'Message not found');
		}

		const messageData = messageDoc.data();

		// Check if user owns this message
		if (messageData?.userId !== locals.user.uid) {
			throw error(403, 'You can only edit your own messages');
		}

		// Check if message is already deleted
		if (messageData?.isDeleted) {
			throw error(400, 'Cannot edit deleted message');
		}

		// Update message
		await messageRef.update({
			message: message.trim(),
			isEdited: true,
			editedAt: new Date()
		});

		return json({
			success: true,
			message: 'Message updated successfully'
		});
	} catch (err: any) {
		console.error('Error editing chat message:', err);
		if (err.status) throw err;
		throw error(500, 'Failed to edit message');
	}
};

/**
 * DELETE /api/memorials/[memorialId]/chat/[chatId]
 * Delete a chat message (user can delete their own, memorial owner can delete any)
 */
export const DELETE: RequestHandler = async ({ params, locals }) => {
	const { memorialId, chatId } = params;

	// Require authentication
	if (!locals.user) {
		throw error(401, 'Authentication required');
	}

	try {
		// Get the message
		const messageRef = adminDb
			.collection('memorials')
			.doc(memorialId)
			.collection('chat')
			.doc(chatId);

		const messageDoc = await messageRef.get();

		if (!messageDoc.exists) {
			throw error(404, 'Message not found');
		}

		const messageData = messageDoc.data();

		// Get memorial to check if user is owner
		const memorialRef = adminDb.collection('memorials').doc(memorialId);
		const memorialDoc = await memorialRef.get();

		if (!memorialDoc.exists) {
			throw error(404, 'Memorial not found');
		}

		const memorialData = memorialDoc.data();

		// Check if user can delete (own message, memorial owner, or admin)
		const canDelete =
			messageData?.userId === locals.user.uid ||
			locals.user.role === 'admin' ||
			locals.user.uid === memorialData?.ownerUid ||
			locals.user.uid === memorialData?.creatorUid ||
			locals.user.uid === memorialData?.funeralDirectorUid;

		if (!canDelete) {
			throw error(403, 'You do not have permission to delete this message');
		}

		// Soft delete (mark as deleted instead of removing)
		await messageRef.update({
			isDeleted: true,
			deletedAt: new Date(),
			deletedBy: locals.user.uid
		});

		return json({
			success: true,
			message: 'Message deleted successfully'
		});
	} catch (err: any) {
		console.error('Error deleting chat message:', err);
		if (err.status) throw err;
		throw error(500, 'Failed to delete message');
	}
};
