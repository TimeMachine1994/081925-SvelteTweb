import { json } from '@sveltejs/kit';
import { dev } from '$app/environment';
import type { RequestHandler } from './$types';
import { adminAuth } from '$lib/server/firebase';
import { ADMIN_ROLES } from '$lib/admin/permissions';

/**
 * DEV-ONLY: Set the granular `adminRole` custom claim on the currently
 * logged-in admin so the RBAC permission system (and the admin sidebar nav)
 * resolves correctly.
 *
 * Background: `hooks.server.ts` reads `adminRole` from Firebase custom claims.
 * Legacy admins only had `role: 'admin'` (which is NOT one of the five RBAC
 * roles in `$lib/admin/permissions`), so `hasPermission` denied everything.
 *
 * Usage (while logged in as an admin):
 *   GET /debug/set-super-admin               -> sets adminRole = 'super_admin'
 *   GET /debug/set-super-admin?role=content_admin
 *
 * The claim is read fresh from the user record on every request, so the change
 * takes effect on your next navigation — no logout required.
 */
export const GET: RequestHandler = async ({ locals, url }) => {
	if (!dev) {
		return json({ error: 'This endpoint is only available in development.' }, { status: 403 });
	}

	const user = locals.user;
	if (!user) {
		return json({ error: 'You must be logged in.' }, { status: 401 });
	}
	if (!user.isAdmin || user.role !== 'admin') {
		return json({ error: 'You must already be an admin to set an admin role.' }, { status: 403 });
	}

	const role = url.searchParams.get('role') || 'super_admin';
	if (!(role in ADMIN_ROLES)) {
		return json(
			{ error: `Invalid role "${role}". Valid roles: ${Object.keys(ADMIN_ROLES).join(', ')}` },
			{ status: 400 }
		);
	}

	try {
		const record = await adminAuth.getUser(user.uid);
		const existingClaims = record.customClaims || {};

		await adminAuth.setCustomUserClaims(user.uid, {
			...existingClaims,
			role: 'admin',
			adminRole: role
		});

		const updated = await adminAuth.getUser(user.uid);

		return json({
			success: true,
			message: `adminRole set to "${role}" for ${user.email}. Refresh /admin to see the full sidebar.`,
			uid: user.uid,
			claims: updated.customClaims
		});
	} catch (error) {
		console.error('Error setting adminRole claim:', error);
		const message = error instanceof Error ? error.message : 'Unknown error';
		return json({ error: message }, { status: 500 });
	}
};
