// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			user: {
				id: string;
				email: string;
				firstName: string;
				lastName: string;
				role: 'client' | 'lawyer' | 'admin' | 'staff';
				phoneNumber: string | null;
				addressLine1: string | null;
				addressLine2: string | null;
				city: string | null;
				state: string | null;
				zipCode: string | null;
				dateOfBirth: string | null;
				preferredContact: 'email' | 'phone' | 'text' | null;
				emergencyContactName: string | null;
				emergencyContactPhone: string | null;
				squareCustomerId: string | null;
				squareCardId: string | null;
				cardLastFour: string | null;
				cardBrand: string | null;
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
