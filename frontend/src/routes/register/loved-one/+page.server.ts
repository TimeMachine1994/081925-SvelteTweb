import { adminAuth, adminDb } from '$lib/server/firebase';
import { fail, redirect, isRedirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { sendRegistrationEmail } from '$lib/server/email';
import { indexMemorial } from '$lib/server/algolia-indexing';
import type { Memorial } from '$lib/types/memorial';

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

// Helper function to generate slug from loved one's name
function generateSlug(lovedOneName: string): string {
	console.log('🔗 Generating slug for:', lovedOneName);
	const slug = `celebration-of-life-for-${lovedOneName
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, '') // Remove special characters
		.replace(/\s+/g, '-') // Replace spaces with hyphens
		.replace(/-+/g, '-') // Replace multiple hyphens with single
		.replace(/^-|-$/g, '')}` // Remove leading/trailing hyphens
		.substring(0, 100); // Limit length
	console.log('🔗 Generated slug:', slug);
	return slug;
}

export const actions: Actions = {
	default: async ({ request }) => {
		console.log('Family member registration started 👨‍👩‍👧‍👦');
		const data = await request.formData();
		const lovedOneName = (data.get('lovedOneName') as string)?.trim();
		const name = (data.get('name') as string)?.trim();
		const email = (data.get('email') as string)?.trim();
		const phone = (data.get('phone') as string)?.trim();

		if (!lovedOneName || !name || !email) {
			return fail(400, { error: 'Please fill out all required fields.' });
		}

		const password = generateRandomPassword();
		const slug = generateSlug(lovedOneName);
		const fullSlug = `tributes/${slug}`;

		try {
			// 1. Create user in Firebase Auth
			console.log(`Attempting to create user: ${email} 👤`);
			const userRecord = await adminAuth.createUser({
				email,
				password,
				displayName: name
			});
			console.log(`User created successfully: ${userRecord.uid}`);

			// 2. Set custom claim for owner role
			await adminAuth.setCustomUserClaims(userRecord.uid, { role: 'owner' });
			console.log(`Custom claim 'owner' set for ${email} 👑`);

			// 3. Create user profile in Firestore
			await adminDb.collection('users').doc(userRecord.uid).set({
				email,
				displayName: name,
				phone,
				role: 'owner',
				createdAt: new Date()
			});
			console.log(`User profile created for ${email} with owner role 📝`);

			// 4. Create memorial
			const memorialData = {
				lovedOneName: lovedOneName,
				slug,
				fullSlug,
				createdByUserId: userRecord.uid,
				creatorEmail: email,
				familyContactEmail: email,
				createdAt: new Date(),
				updatedAt: new Date(),
				creatorUid: userRecord.uid // for legacy compatibility
			};
			const memorialRef = await adminDb.collection('memorials').add(memorialData);
			console.log(`Memorial created for ${lovedOneName} with slug: ${slug} 🕊️`);

			// Index the new memorial in Algolia
			await indexMemorial({ ...memorialData, id: memorialRef.id } as Memorial);

			// 5. Send registration email
			// For now, we'll use the simple registration email.
			// TODO: In the future, we can expand this to use the enhanced email by collecting more data.
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
			if (error.code === 'auth/email-already-exists') {
				return fail(400, { error: `An account with email ${email} already exists.` });
			}
			return fail(500, { error: error.message });
		}

		return { success: true };
	}
};