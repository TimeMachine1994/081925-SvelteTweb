import { writable } from 'svelte/store';
import { onIdTokenChanged, type User as FirebaseUser } from 'firebase/auth';
import { invalidateAll } from '$app/navigation';
import { browser } from '$app/environment';
import { auth } from '$lib/firebase';

export interface User {
	uid: string;
	email: string | null | undefined;
	displayName: string | undefined;
}

export const user = writable<User | null>(null);

let initialized = false;

export function initializeAuth() {
	if (!browser || initialized) {
		return;
	}

	initialized = true;
	console.log('🔑 Initializing Firebase Auth listener...');

	onIdTokenChanged(auth, async (firebaseUser: FirebaseUser | null) => {
		if (firebaseUser) {
			console.log('🔄 Firebase ID token changed. User is signed in:', firebaseUser.uid);
			const token = await firebaseUser.getIdToken();
			
			console.log('🚀 Sending token to server to create session...');
			const response = await fetch('/api/session', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ token })
			});

			if (response.ok) {
				console.log('✅ Server session created successfully.');
				const userData: User = {
					uid: firebaseUser.uid,
					email: firebaseUser.email,
					displayName: firebaseUser.displayName ?? undefined
				};
				user.set(userData);
				await invalidateAll(); // Re-run load functions
				console.log('🔄 invalidated all data, load functions will re-run.');
			} else {
				console.error('❌ Failed to create server session.');
			}
		} else {
			console.log('🔄 Firebase ID token changed. User is signed out.');
			user.set(null);
			
			console.log('🚀 Notifying server to delete session...');
			const response = await fetch('/api/session', {
				method: 'DELETE'
			});

			if (response.ok) {
				console.log('✅ Server session deleted successfully.');
				await invalidateAll(); // Re-run load functions
				console.log('🔄 invalidated all data, load functions will re-run.');
			} else {
				console.error('❌ Failed to delete server session.');
			}
		}
	});
}