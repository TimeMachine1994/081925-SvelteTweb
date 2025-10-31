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
				// Demo mode fields
				isDemo?: boolean;
				demoSessionId?: string;
				demoExpiresAt?: string;
			} | null;
		}
		interface PageData {
			user: {
				uid: string;
				email: string | null;
				displayName?: string;
				role: 'admin' | 'owner' | 'funeral_director';
				isAdmin: boolean;
				// Demo mode fields
				isDemo?: boolean;
				demoSessionId?: string;
				demoExpiresAt?: string;
			} | null;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
