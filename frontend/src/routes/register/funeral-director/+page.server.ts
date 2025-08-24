import { adminAuth, adminDb } from '$lib/server/firebase';
import { fail, redirect, isRedirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { sendRegistrationEmail } from '$lib/server/email';

// Helper function to generate a random password
function generateRandomPassword(length = 12) {
	const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
	let password = '';
	for (let i = 0; i < length; i++) {
		const randomIndex = Math.floor(Math.random() * charset.length);
		password += charset[randomIndex];
	}
	return password;
}

export const actions: Actions = {
	default: async ({ request }) => {
		console.log('Funeral director registration started ⚰️');
		const data = await request.formData();
		const lovedOneName = data.get('lovedOneName') as string;
		const directorName = data.get('directorName') as string;
		const email = data.get('email') as string;
		const phone = data.get('phone') as string;
		const funeralHomeName = data.get('funeralHomeName') as string;

		if (!lovedOneName || !directorName || !email || !funeralHomeName) {
			return fail(400, { error: 'Please fill out all required fields.' });
		}

		const password = generateRandomPassword();

		try {
			// 1. Create user in Firebase Auth
			console.log(`Attempting to create user: ${email} 👤`);
			const userRecord = await adminAuth.createUser({
				email,
				password,
				displayName: directorName
			});
			console.log(`User created successfully: ${userRecord.uid}`);

			// 2. Set custom claim for owner role
			await adminAuth.setCustomUserClaims(userRecord.uid, { role: 'owner' });
			console.log(`Custom claim 'owner' set for ${email} 👑`);

			// 3. Create user profile in Firestore
			await adminDb.collection('users').doc(userRecord.uid).set({
				email,
				displayName: directorName,
				phone,
				funeralHomeName,
				role: 'owner',
				createdAt: new Date()
			});
			console.log(`User profile created for ${email} with owner role 📝`);

			// 4. Create memorial
			const slug = `celebration-of-life-for-${lovedOneName
				.trim()
				.toLowerCase()
				.replace(/\s+/g, '-')}`;
			await adminDb.collection('memorials').add({
				lovedOneName: lovedOneName.trim(),
				slug,
				creatorUid: userRecord.uid,
				createdAt: new Date()
			});
			console.log(`Memorial created for ${lovedOneName} with slug: ${slug} 🕊️`);

			// 5. Send registration email
			await sendRegistrationEmail(email, password);

			// 6. Create a custom token for auto-login
			const customToken = await adminAuth.createCustomToken(userRecord.uid);
			console.log(`Custom token created for ${email} 🎟️`);

			// 7. Redirect to the session creation page
			const redirectUrl = `/auth/session?token=${customToken}&slug=${slug}`;
			redirect(303, redirectUrl);
		} catch (error: any) {
			if (isRedirect(error)) {
				throw error;
			}
			console.error('Error during registration process:', error);
			return fail(500, { error: error.message });
		}
	}
};