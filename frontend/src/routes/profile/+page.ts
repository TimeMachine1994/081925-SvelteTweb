import { db } from '$lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { user } from '$lib/auth';
import { get } from 'svelte/store';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	const currentUser = get(user);
	if (currentUser) {
		const docRef = doc(db, 'users', currentUser.uid);
		const docSnap = await getDoc(docRef);
		if (docSnap.exists()) {
			return {
				profile: docSnap.data()
			};
		}
	}
	return {
		profile: null
	};
};