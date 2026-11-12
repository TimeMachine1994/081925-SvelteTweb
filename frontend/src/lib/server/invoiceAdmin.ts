import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { hasPermission, type AdminUser } from '$lib/admin/permissions';

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Auth for /api/admin/invoices/** — must be an admin whose role grants the
 * given `invoice` action. Returns the admin user, or a JSON error Response.
 */
export function requireInvoicePermission(
	locals: App.Locals,
	action: 'read' | 'create' | 'update'
): { user: AdminUser } | { response: Response } {
	if (!locals.user) {
		return { response: json({ error: 'Authentication required' }, { status: 401 }) };
	}
	const user: AdminUser = {
		uid: locals.user.uid,
		email: locals.user.email || '',
		adminRole: locals.user.adminRole
	};
	if (
		!locals.user.isAdmin ||
		locals.user.role !== 'admin' ||
		!hasPermission(user, 'invoice', action)
	) {
		return { response: json({ error: 'Permission denied' }, { status: 403 }) };
	}
	return { user };
}

/** Public base URL for `/pay/...` links (env first so emailed links never point at a preview origin). */
export function paymentUrlFor(invoiceId: string, request: Request): string {
	const origin =
		env.PUBLIC_BASE_URL || request.headers.get('origin') || 'https://tributestream.com';
	return `${origin.replace(/\/$/, '')}/pay/${invoiceId}`;
}
