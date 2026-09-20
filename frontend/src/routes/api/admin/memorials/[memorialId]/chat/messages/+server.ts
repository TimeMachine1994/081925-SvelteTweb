import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { hasPermission } from '$lib/admin/permissions';
import { createMemorialChatMessage, listMemorialChatMessages } from '$lib/server/db/repos/chat';

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
 * GET /api/admin/memorials/[memorialId]/chat/messages
 * Moderation view of the memorial's chat — includes soft-deleted messages.
 * Query params: limit (default 100), before (createdAt cursor)
 */
export const GET: RequestHandler = async ({ params, url, locals }) => {
	requireAdmin(locals);
	const { memorialId } = params;

	try {
		const limit = Math.min(parseInt(url.searchParams.get('limit') || '100'), 200);
		const before = url.searchParams.get('before');

		const messages = await listMemorialChatMessages(memorialId, { limit, beforeCreatedAt: before });

		return json({
			success: true,
			messages: messages.reverse(),
			hasMore: messages.length === limit
		});
	} catch (err: any) {
		console.error('[Admin Chat API] Error fetching messages:', err);
		return json({ success: false, message: 'Failed to load chat messages' }, { status: 500 });
	}
};

/**
 * POST /api/admin/memorials/[memorialId]/chat/messages
 * Send a message as "Admin" — lets moderators post directly into the thread.
 */
export const POST: RequestHandler = async ({ params, request, locals }) => {
	requireAdmin(locals);
	const { memorialId } = params;

	try {
		const { message } = await request.json();
		const trimmed = message?.trim();
		if (!trimmed) return json({ success: false, message: 'Message is required' }, { status: 400 });
		if (trimmed.length > 500) {
			return json(
				{ success: false, message: 'Message cannot exceed 500 characters' },
				{ status: 400 }
			);
		}

		const created = await createMemorialChatMessage({
			memorialId,
			authorType: 'user',
			userId: locals.user!.uid,
			userName: locals.user!.displayName || 'Admin',
			userRole: 'admin',
			message: trimmed
		});

		return json({ success: true, message: created }, { status: 201 });
	} catch (err: any) {
		console.error('[Admin Chat API] Error sending message:', err);
		return json({ success: false, message: 'Failed to send message' }, { status: 500 });
	}
};
