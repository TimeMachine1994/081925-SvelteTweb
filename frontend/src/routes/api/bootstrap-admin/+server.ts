// Bootstrap endpoint to create the first admin user
// This should be disabled or removed after initial setup

import { json, type RequestHandler } from '@sveltejs/kit';
import { adminAuth } from '$lib/server/firebase';
import { adminDb } from '$lib/server/firebase';

// SECURITY: Only allow specific email to become admin
const ALLOWED_ADMIN_EMAIL = 'austinbryanfilm@gmail.com';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		// Must be logged in
		if (!locals.user) {
			return json({ error: 'Must be logged in' }, { status: 401 });
		}

		// Only allow the specific email
		if (locals.user.email !== ALLOWED_ADMIN_EMAIL) {
			return json({ error: 'Not authorized for admin bootstrap' }, { status: 403 });
		}

		const uid = locals.user.uid;
		const email = locals.user.email;

		console.log(`🔐 [BOOTSTRAP] Setting admin claims for ${email} (${uid})`);

		// Set custom claims on Firebase Auth
		await adminAuth.setCustomUserClaims(uid, { 
			role: 'admin',
			admin: true 
		});

		// Update Firestore document
		await adminDb.collection('users').doc(uid).set({
			role: 'admin',
			isAdmin: true,
			email: email,
			updatedAt: new Date()
		}, { merge: true });

		console.log(`✅ [BOOTSTRAP] Admin setup complete for ${email}`);

		return json({ 
			success: true, 
			message: `Admin role set for ${email}. Please log out and log back in.`
		});

	} catch (error: any) {
		console.error('❌ [BOOTSTRAP] Error:', error);
		return json({ error: error.message }, { status: 500 });
	}
};
