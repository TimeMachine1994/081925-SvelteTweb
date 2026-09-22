import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import {
	editMemorialChatMessage,
	getMemorialChatMessage,
	softDeleteMemorialChatMessage
} from '$lib/server/db/repos/chat';
import type { UpdateChatMessageInput } from '$lib/types/chat';

/**
 * PUT /api/memorials/[memorialId]/chat/[messageId]
 * Edit an existing chat message. Signed-in authors only (guests can't edit).
 */
export const PUT: RequestHandler = async ({ params, request, locals }) => {
	const { memorialId, messageId } = params;

	if (!locals.user) throw error(401, 'You must be signed in to edit messages');

	try {
		const body = (await request.json()) as UpdateChatMessageInput;
		const message = body.message?.trim();

		if (!message) throw error(400, 'Message is required');
		if (message.length > 500) throw error(400, 'Message cannot exceed 500 characters');

		const existing = await getMemorialChatMessage(memorialId, messageId);
		if (!existing) throw error(404, 'Message not found');
		if (existing.userId !== locals.user.uid)
			throw error(403, 'You can only edit your own messages');
		if (existing.isDeleted) throw error(400, 'Cannot edit a deleted message');

		await editMemorialChatMessage(memorialId, messageId, message);

		return json({ id: messageId, message, isEdited: true, editedAt: new Date().toISOString() });
	} catch (err: any) {
		if (err.status) throw err;
		console.error('[Chat API] Error editing message:', err);
		throw error(500, 'Failed to edit message');
	}
};

/**
 * DELETE /api/memorials/[memorialId]/chat/[messageId]
 * Soft-delete a message: the author themselves, or the memorial owner/FD/admin.
 * (Moderator-only deletes that should bypass ownership entirely go through
 * the admin API at /api/admin/memorials/[memorialId]/chat/messages/[messageId].)
 */
export const DELETE: RequestHandler = async ({ params, locals }) => {
	const { memorialId, messageId } = params;

	if (!locals.user) throw error(401, 'You must be signed in to delete messages');

	try {
		const existing = await getMemorialChatMessage(memorialId, messageId);
		if (!existing) throw error(404, 'Message not found');

		const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();
		const memorialData = memorialDoc.data();

		const isMessageOwner = existing.userId === locals.user.uid;
		const isMemorialOwner = memorialData?.ownerUid === locals.user.uid;
		const isFuneralDirector = memorialData?.funeralDirectorUid === locals.user.uid;
		const isAdmin = locals.user.role === 'admin';

		if (!isMessageOwner && !isMemorialOwner && !isFuneralDirector && !isAdmin) {
			throw error(403, 'You do not have permission to delete this message');
		}

		await softDeleteMemorialChatMessage(memorialId, messageId, locals.user.uid);

		return json({ success: true });
	} catch (err: any) {
		if (err.status) throw err;
		console.error('[Chat API] Error deleting message:', err);
		throw error(500, 'Failed to delete message');
	}
};
