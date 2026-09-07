// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: {
				uid: string;
				email: string | null;
				displayName?: string;
				role: 'admin' | 'owner' | 'funeral_director';
				isAdmin: boolean;
				/** Granular admin RBAC role (super_admin, content_admin, etc.). Only set for admins. */
				adminRole?: string;
			} | null;
		}
		interface PageData {
			user: {
				uid: string;
				email: string | null;
				displayName?: string;
				role: 'admin' | 'owner' | 'funeral_director';
				isAdmin: boolean;
				adminRole?: string;
			} | null;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
