import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '$lib/firebase';
import { readable } from 'svelte/store';
import { browser } from '$app/environment';

export const user = readable<User | null | undefined>(undefined, (set) => {
	if (browser) {
		const unsubscribe = onAuthStateChanged(
			auth,
			(user) => {
				set(user);
			},
			(error) => {
				console.error('Error in onAuthStateChanged:', error);
				set(null);
			}
		);

		return () => unsubscribe();
	} else {
		set(null);
	}
});