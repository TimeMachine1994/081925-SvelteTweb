import { adminAuth, adminDb } from '$lib/server/firebase';
import { fail, redirect } from '@sveltejs/kit';
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
		console.log('Family member registration started 👨‍👩‍👧‍👦');
		const data = await request.formData();
		const lovedOneName = data.get('lovedOneName') as string;
		const name = data.get('name') as string;
		const email = data.get('email') as string;
		const phone = data.get('phone') as string;

		if (!lovedOneName || !name || !email) {
			return fail(400, { error: 'Please fill out all required fields.' });
		}

		const password = generateRandomPassword();

		try {
			// 1. Create user in Firebase Auth
			console.log(`Attempting to create user: ${email} 👤`);
			const userRecord = await adminAuth.createUser({
				email,
				password,
				displayName: name
			});
			console.log(`User created successfully: ${userRecord.uid}`);

			// 2. Create user profile in Firestore
			await adminDb.collection('users').doc(userRecord.uid).set({
				email,
				displayName: name,
				phone,
				createdAt: new Date()
			});
			console.log(`User profile created for ${email} 📝`);

			// 3. Create memorial
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

			// 4. Send registration email
			await sendRegistrationEmail(email, password);

			return { success: true };
		} catch (error: any) {
			console.error('Error during registration process:', error);
			return fail(500, { error: error.message });
		}
	}
};