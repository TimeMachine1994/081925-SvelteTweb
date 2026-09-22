import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { hasPermission } from '$lib/admin/permissions';
import { getMemorial, updateMemorialFields } from '$lib/server/db/repos/memorials';

function requireAdmin(locals: App.Locals) {
	if (!locals.user || locals.user.role !== 'admin') {
		throw error(403, 'Admin access required');
	}
	const adminUser = {
		uid: locals.user.uid,
		email: locals.user.email || '',
		adminRole: locals.user.adminRole
	};
	if (!hasPermission(adminUser, 'memorial', 'update')) {
		throw error(403, 'Insufficient permissions');
	}
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * PATCH /api/admin/memorials/[id]/basic-info
 *
 * Edits identity/contact fields that never touch the memorial's URL
 * (fullSlug/slug) — see /api/admin/memorials/[id]/slug for that.
 *
 * Body: { lovedOneName?, birthDate?, deathDate?, familyContactName?,
 *         familyContactEmail?, familyContactPhone?, familyContactPreference?,
 *         additionalNotes? }
 */
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	requireAdmin(locals);
	const memorialId = params.id;
	if (!memorialId) throw error(400, 'Memorial ID required');

	try {
		const body = await request.json();
		const existing = await getMemorial(memorialId);
		if (!existing) throw error(404, 'Memorial not found');

		const patch: Record<string, unknown> = {};

		if (body.lovedOneName !== undefined) {
			const name = String(body.lovedOneName).trim();
			if (!name) throw error(400, "Loved one's name is required");
			if (name.length > 200) throw error(400, "Loved one's name must be 200 characters or less");
			patch.lovedOneName = name;
		}

		if (body.birthDate !== undefined) patch.birthDate = body.birthDate || null;
		if (body.deathDate !== undefined) patch.deathDate = body.deathDate || null;

		const birthDate = (patch.birthDate ?? existing.birthDate) as string | null;
		const deathDate = (patch.deathDate ?? existing.deathDate) as string | null;
		if (birthDate && deathDate && new Date(deathDate) < new Date(birthDate)) {
			throw error(400, 'Death date cannot be before birth date');
		}

		if (body.familyContactName !== undefined) {
			const v = String(body.familyContactName || '').trim();
			if (v.length > 200) throw error(400, 'Family contact name must be 200 characters or less');
			patch.familyContactName = v || null;
		}

		if (body.familyContactEmail !== undefined) {
			const v = String(body.familyContactEmail || '').trim();
			if (v && !EMAIL_RE.test(v)) throw error(400, 'Family contact email is not a valid email address');
			patch.familyContactEmail = v || null;
		}

		if (body.familyContactPhone !== undefined) {
			const v = String(body.familyContactPhone || '').trim();
			if (v.length > 40) throw error(400, 'Family contact phone must be 40 characters or less');
			patch.familyContactPhone = v || null;
		}

		if (body.familyContactPreference !== undefined) {
			const v = body.familyContactPreference;
			if (v !== null && v !== 'phone' && v !== 'email') {
				throw error(400, "Family contact preference must be 'phone' or 'email'");
			}
			patch.familyContactPreference = v || null;
		}

		if (body.additionalNotes !== undefined) {
			const v = String(body.additionalNotes || '');
			if (v.length > 2000) throw error(400, 'Additional notes must be 2000 characters or less');
			patch.additionalNotes = v.trim() || null;
		}

		if (Object.keys(patch).length === 0) {
			return json({ success: false, message: 'No valid fields provided' }, { status: 400 });
		}

		await updateMemorialFields(memorialId, patch);

		await adminDb.collection('auditLogs').add({
			action: 'UPDATE_BASIC_INFO',
			performedBy: locals.user!.uid,
			performedByEmail: locals.user!.email,
			targetId: memorialId,
			targetType: 'memorial',
			changes: patch,
			timestamp: new Date()
		});

		return json({ success: true, updated: patch });
	} catch (err: any) {
		if (err.status) throw err;
		console.error('[Basic Info API] Error updating memorial:', err);
		throw error(500, err.message || 'Failed to update basic information');
	}
};
