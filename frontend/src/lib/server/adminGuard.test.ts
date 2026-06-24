import { describe, it, expect, vi } from 'vitest';

vi.mock('@sveltejs/kit', () => ({
	redirect: vi.fn((status: number, location: string) => {
		const err: any = new Error(`Redirect to ${location}`);
		err.status = status;
		err.location = location;
		throw err;
	}),
	fail: vi.fn((status: number, data: any) => ({ status, data }))
}));

import { requireAdmin, requireAdminAction } from './adminGuard';

const superAdmin = {
	uid: 'a1',
	email: 'admin@test.com',
	displayName: 'Admin',
	role: 'admin' as const,
	isAdmin: true,
	adminRole: 'super_admin'
};

const readonlyAdmin = { ...superAdmin, uid: 'a2', adminRole: 'readonly_admin' };

describe('requireAdmin (loader guard)', () => {
	it('redirects unauthenticated users to /login', () => {
		expect(() => requireAdmin({ user: null })).toThrowError(/\/login/);
	});

	it('redirects non-admins to /profile', () => {
		const user = { ...superAdmin, role: 'owner' as const, isAdmin: false };
		expect(() => requireAdmin({ user })).toThrowError(/\/profile/);
	});

	it('allows a super_admin through any permission check', () => {
		const result = requireAdmin({ user: superAdmin }, { resource: 'memorial', action: 'delete' });
		expect(result.adminRole).toBe('super_admin');
	});

	it('denies a readonly_admin a write action', () => {
		expect(() =>
			requireAdmin({ user: readonlyAdmin }, { resource: 'memorial', action: 'delete' })
		).toThrowError(/forbidden/);
	});

	it('allows a readonly_admin a read action', () => {
		const result = requireAdmin(
			{ user: readonlyAdmin },
			{ resource: 'memorial', action: 'read' }
		);
		expect(result.adminRole).toBe('readonly_admin');
	});
});

describe('requireAdminAction (form action guard)', () => {
	it('returns a 401 failure when unauthenticated', () => {
		const result = requireAdminAction({ user: null });
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.failure.status).toBe(401);
	});

	it('returns a 403 failure for insufficient permission', () => {
		const result = requireAdminAction(
			{ user: readonlyAdmin },
			{ resource: 'memorial', action: 'update' }
		);
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.failure.status).toBe(403);
	});

	it('returns ok with the admin user when permitted', () => {
		const result = requireAdminAction(
			{ user: superAdmin },
			{ resource: 'memorial', action: 'update' }
		);
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.user.email).toBe('admin@test.com');
	});
});
