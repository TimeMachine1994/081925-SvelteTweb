/**
 * ADMIN ROUTE GUARD
 *
 * Centralizes server-side authentication + RBAC enforcement for admin
 * routes (loaders and form actions). Wraps the 5-tier permission model in
 * `$lib/admin/permissions` so that granular roles are enforced on the
 * server, not just the client.
 *
 * Usage in a `+page.server.ts` loader:
 *   export const load = async ({ locals }) => {
 *     const admin = requireAdmin(locals, { resource: 'memorial', action: 'read' });
 *     ...
 *   };
 *
 * Usage in a form action (returns a typed fail instead of redirecting):
 *   const guard = requireAdminAction(locals, { resource: 'memorial', action: 'update' });
 *   if (!guard.ok) return guard.failure;
 *   const admin = guard.user;
 */
import { redirect, fail, type ActionFailure } from '@sveltejs/kit';
import { hasPermission, type AdminUser } from '$lib/admin/permissions';

export interface PermissionCheck {
	resource: string;
	action: string;
	/** Optional target resource for condition/scope evaluation. */
	target?: unknown;
}

type Locals = App.Locals;

/**
 * Build an AdminUser from request locals for permission checks.
 */
function toAdminUser(user: NonNullable<Locals['user']>): AdminUser {
	return {
		uid: user.uid,
		email: user.email || '',
		adminRole: user.adminRole
	};
}

/**
 * Guard a loader. Throws a redirect for unauthenticated/unauthorized users.
 * Returns the AdminUser when access is granted.
 */
export function requireAdmin(locals: Locals, check?: PermissionCheck): AdminUser {
	const user = locals.user;

	if (!user) {
		throw redirect(302, '/login');
	}

	if (!user.isAdmin || user.role !== 'admin') {
		throw redirect(302, '/profile');
	}

	const adminUser = toAdminUser(user);

	if (check && !hasPermission(adminUser, check.resource, check.action, check.target)) {
		// Authenticated admin but lacking the specific permission.
		throw redirect(302, '/admin?error=forbidden');
	}

	return adminUser;
}

export type GuardResult =
	| { ok: true; user: AdminUser }
	| { ok: false; failure: ActionFailure<{ error: string }> };

/**
 * Guard a form action. Returns a discriminated result with a typed `fail`
 * payload instead of redirecting, so actions can surface errors in the UI.
 */
export function requireAdminAction(locals: Locals, check?: PermissionCheck): GuardResult {
	const user = locals.user;

	if (!user) {
		return { ok: false, failure: fail(401, { error: 'Authentication required' }) };
	}

	if (!user.isAdmin || user.role !== 'admin') {
		return { ok: false, failure: fail(403, { error: 'Admin access required' }) };
	}

	const adminUser = toAdminUser(user);

	if (check && !hasPermission(adminUser, check.resource, check.action, check.target)) {
		return {
			ok: false,
			failure: fail(403, { error: 'You do not have permission to perform this action' })
		};
	}

	return { ok: true, user: adminUser };
}
