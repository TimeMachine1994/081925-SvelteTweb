import type { LayoutServerLoad } from './$types';
import { getAdminDb } from '$lib/server/firebase';
import type { User } from 'firecms/src/types/user';

export const load: LayoutServerLoad = async ({ locals }) => {
	console.log('✨ [+layout.server.ts] Load function running...');
	let showFirstVisitPopup = locals.showFirstVisitPopup;

	// If the cookie wasn't present or was false, check Firestore if the user is logged in
	if (locals.user && showFirstVisitPopup === undefined) {
		console.log('🔍 No first-visit cookie, checking Firestore for user:', locals.user.uid);
		try {
			const userDoc = await getAdminDb().collection('users').doc(locals.user.uid).get();
			const userData = userDoc.data() as User | undefined;
			if (userData?.firstTimeMemorialVisit === true) {
				showFirstVisitPopup = true;
				console.log('✅ Firestore indicates firstTimeMemorialVisit is true.');
			} else {
				showFirstVisitPopup = false;
				console.log('❌ Firestore indicates firstTimeMemorialVisit is false or not set.');
			}
		} catch (error) {
			console.error('❌ Error fetching user data from Firestore in +layout.server.ts:', error);
			showFirstVisitPopup = false; // Default to false on error
		}
	} else if (!locals.user) {
		showFirstVisitPopup = false; // Ensure false if no user is logged in
		console.log('🚫 No user logged in, showFirstVisitPopup set to false.');
	}

	console.log('✨ [+layout.server.ts] Returning data.showFirstVisitPopup:', showFirstVisitPopup);
	return {
		user: locals.user,
		showFirstVisitPopup
	};
};