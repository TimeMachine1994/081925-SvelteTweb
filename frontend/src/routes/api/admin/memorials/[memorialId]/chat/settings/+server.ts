import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { hasPermission } from '$lib/admin/permissions';
import { getChatSettings, upsertChatSettings } from '$lib/server/db/repos/chat';

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
		throw error(403, 'You do not have permission to manage chat');
	}
}

/**
 * GET /api/admin/memorials/[memorialId]/chat/settings
 */
export const GET: RequestHandler = async ({ params, locals }) => {
	requireAdmin(locals);
	const { memorialId } = params;

	try {
		const settings = await getChatSettings(memorialId);
		return json({ success: true, settings });
	} catch (err: any) {
		console.error('[Admin Chat API] Error fetching settings:', err);
		return json({ success: false, message: 'Failed to fetch chat settings' }, { status: 500 });
	}
};

/**
 * PATCH /api/admin/memorials/[memorialId]/chat/settings
 * Body: { enabled?: boolean, locked?: boolean, archived?: boolean }
 */
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	requireAdmin(locals);
	const { memorialId } = params;

	try {
		const body = await request.json();
		const patch: Partial<{ enabled: boolean; locked: boolean; archived: boolean }> = {};

		if (typeof body.enabled === 'boolean') patch.enabled = body.enabled;
		if (typeof body.locked === 'boolean') patch.locked = body.locked;
		if (typeof body.archived === 'boolean') patch.archived = body.archived;

		if (Object.keys(patch).length === 0) {
			return json({ success: false, message: 'No valid settings provided' }, { status: 400 });
		}

		const settings = await upsertChatSettings(memorialId, patch);
		return json({ success: true, settings });
	} catch (err: any) {
		console.error('[Admin Chat API] Error updating settings:', err);
		return json({ success: false, message: 'Failed to update chat settings' }, { status: 500 });
	}
};
