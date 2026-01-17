// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			user: {
				id: string;
				username: string;
				email: string;
				firstName: string;
				lastName: string;
				role: 'client' | 'lawyer' | 'admin';
				phoneNumber: string | null;
			} | null;
			session: {
				id: string;
				userId: string;
				expiresAt: Date;
			} | null;
		}
	}
}

export {};
