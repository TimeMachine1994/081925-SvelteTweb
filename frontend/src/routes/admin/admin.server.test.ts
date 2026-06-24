import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load } from './+page.server';

// Mock SvelteKit redirect/fail
vi.mock('@sveltejs/kit', () => ({
	redirect: vi.fn((status: number, location: string) => {
		const err: any = new Error(`Redirect to ${location}`);
		err.status = status;
		err.location = location;
		throw err;
	}),
	fail: vi.fn((status: number, data: any) => ({ status, data }))
}));

// Mock Firebase Admin with a chainable query builder
vi.mock('$lib/server/firebase', () => {
	const makeChain = () => {
		const chain: any = {
			orderBy: vi.fn(() => chain),
			limit: vi.fn(() => chain),
			where: vi.fn(() => chain),
			count: vi.fn(() => chain),
			get: vi.fn().mockResolvedValue({ docs: [], size: 0, data: () => ({ count: 0 }) })
		};
		return chain;
	};
	return {
		adminDb: {
			collection: vi.fn(() => makeChain())
		}
	};
});

// Mock audit logger so the archive action has no side effects
vi.mock('$lib/server/auditLogger', () => ({
	logAdminAction: vi.fn(),
	extractUserContext: vi.fn(() => null)
}));

describe('Admin Dashboard Server Load (RBAC + contract)', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('redirects unauthenticated users to /login', async () => {
		const locals = { user: null };
		await expect(load({ locals } as any)).rejects.toMatchObject({ location: '/login' });
	});

	it('redirects non-admin users to /profile', async () => {
		const locals = {
			user: { email: 'user@test.com', uid: 'u1', role: 'owner', isAdmin: false }
		};
		await expect(load({ locals } as any)).rejects.toMatchObject({ location: '/profile' });
	});

	it('redirects admins missing the role flag to /profile', async () => {
		// isAdmin true but role not 'admin' -> denied by guard
		const locals = {
			user: { email: 'admin@test.com', uid: 'a1', role: 'owner', isAdmin: true }
		};
		await expect(load({ locals } as any)).rejects.toMatchObject({ location: '/profile' });
	});

	it('grants access to admins and returns the dashboard contract', async () => {
		const locals = {
			user: {
				email: 'admin@test.com',
				uid: 'admin-456',
				role: 'admin',
				isAdmin: true,
				adminRole: 'super_admin'
			}
		};

		const result = (await load({ locals } as any)) as any;

		expect(result).toHaveProperty('adminUser');
		expect(result).toHaveProperty('incompleteMemorials');
		expect(result).toHaveProperty('recentMemorials');
		expect(result).toHaveProperty('stats');
		expect(result.stats).toHaveProperty('totalMemorials');
		expect(result.stats).toHaveProperty('unpaidMemorials');
		expect(result.adminUser.email).toBe('admin@test.com');
	});

	it('handles database errors gracefully with a safe fallback', async () => {
		const { adminDb } = await import('$lib/server/firebase');
		vi.mocked(adminDb.collection).mockImplementationOnce(() => {
			throw new Error('Database connection failed');
		});

		const locals = {
			user: {
				email: 'admin@test.com',
				uid: 'a2',
				role: 'admin',
				isAdmin: true,
				adminRole: 'super_admin'
			}
		};

		const result = (await load({ locals } as any)) as any;

		expect(result).toHaveProperty('error');
		expect(result).toHaveProperty('adminUser');
		expect(result.adminUser.email).toBe('admin@test.com');
	});
});
