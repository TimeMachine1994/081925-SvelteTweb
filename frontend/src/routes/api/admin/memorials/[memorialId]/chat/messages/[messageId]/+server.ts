import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { hasPermission } from '$lib/admin/permissions';
import {
	setMemorialChatMessageFlag,
	softDeleteMemorialChatMessage
} from '$lib/server/db/repos/chat';

function requireAdmin(locals: App.Locals) {
	if (!locals.user || locals.user.role !== 'admin') {
		throw error(403, 'Admin access required');
	}
	const adminUser = {
		uid: locals.user.uid,
		email: locals.user.email || '',
		adminRole: locals.user.adminRole
	};
	if (!hasPermission(adminUser, 'stream', 'update')) {
		throw error(403, 'You do not have permission to moderate chat');
	}
}

/**
 * DELETE /api/admin/memorials/[memorialId]/chat/messages/[messageId]
 * Moderator delete — bypasses the author-ownership checks the public
 * user-facing delete endpoint enforces.
 */
export const DELETE: RequestHandler = async ({ params, locals }) => {
	requireAdmin(locals);
	const { memorialId, messageId } = params;

	try {
		await softDeleteMemorialChatMessage(memorialId, messageId, locals.user!.uid);
		return json({ success: true });
	} catch (err: any) {
		console.error('[Admin Chat API] Error deleting message:', err);
		return json({ success: false, message: 'Failed to delete message' }, { status: 500 });
	}
};

/**
 * PATCH /api/admin/memorials/[memorialId]/chat/messages/[messageId]
 * Body: { flagged: boolean, flagReason?: string }
 */
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	requireAdmin(locals);
	const { memorialId, messageId } = params;

	try {
		const { flagged, flagReason } = await request.json();
		if (typeof flagged !== 'boolean') {
			return json({ success: false, message: 'flagged must be a boolean' }, { status: 400 });
		}

		await setMemorialChatMessageFlag(memorialId, messageId, flagged, flagReason);
		return json({ success: true });
	} catch (err: any) {
		console.error('[Admin Chat API] Error flagging message:', err);
		return json({ success: false, message: 'Failed to update message' }, { status: 500 });
	}
};
