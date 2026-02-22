import type { User } from '$lib/server/db/schema';

export function getDashboardRoute(user: User | null): string {
	if (!user) return '/login';
	
	switch (user.role) {
		case 'lawyer':
			return '/dashboard/lawyer';
		case 'admin':
			return '/dashboard/admin';
		case 'client':
		default:
			return '/dashboard/client';
	}
}

export function isLawyer(user: User | null): boolean {
	return user?.role === 'lawyer';
}

export function isClient(user: User | null): boolean {
	return user?.role === 'client';
}

export function isAdmin(user: User | null): boolean {
	return user?.role === 'admin';
}
