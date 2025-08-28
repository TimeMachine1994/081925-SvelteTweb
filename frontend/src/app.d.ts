// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: {
				uid: string;
				email: string | null | undefined;
				displayName: string | undefined;
				role?: string;
				admin?: boolean;
			} | null;
			showFirstVisitPopup?: boolean; // Added for first-time visit tracking
		}
		interface PageData {
			user: {
				uid: string;
				email: string | null | undefined;
				displayName: string | undefined;
				role?: string;
				admin?: boolean;
			} | null;
			showFirstVisitPopup?: boolean; // Added for first-time visit tracking
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
