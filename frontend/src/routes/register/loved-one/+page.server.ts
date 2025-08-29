import { getAdminAuth, getAdminDb } from '$lib/server/firebase';
import { fail, redirect, isRedirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { sendRegistrationEmail } from '$lib/server/email';
import { indexMemorial } from '$lib/server/algolia-indexing';
import type { Memorial } from '$lib/types/memorial';
import { Timestamp } from 'firebase-admin/firestore'; // Import Timestamp

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
	default: async ({ request, cookies }) => {
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
			// 1. Create user in Firebase Auth with retry logic
			console.log(`Attempting to create user: ${email} 👤`);
			let userRecord;
			let retryCount = 0;
			const maxRetries = 2;
			
			while (retryCount <= maxRetries) {
				try {
					console.log(`Creating user attempt ${retryCount + 1}/${maxRetries + 1}...`);
					userRecord = await getAdminAuth().createUser({
						email,
						password,
						displayName: name
					});
					console.log(`✅ User created successfully: ${userRecord.uid}`);
					break; // Success, exit retry loop
				} catch (authError: any) {
					console.error(`❌ User creation attempt ${retryCount + 1} failed:`, authError.message);
					
					// Check if it's a timeout error and we have retries left
					if (authError.message?.includes('timeout') && retryCount < maxRetries) {
						retryCount++;
						console.log(`⏳ Retrying user creation in 2 seconds...`);
						await new Promise(resolve => setTimeout(resolve, 2000));
					} else {
						// Either not a timeout or no retries left
						throw authError;
					}
				}
			}
			
			if (!userRecord) {
				throw new Error('Failed to create user after all retry attempts');
			}

			// 2. Set custom claim for owner role
			await getAdminAuth().setCustomUserClaims(userRecord.uid, { role: 'owner' });
			console.log(`Custom claim 'owner' set for ${email} 👑`);

			// 3. Create user profile in Firestore
			console.log(`Attempting to create user profile for ${email} (UID: ${userRecord.uid}) in Firestore...`);
			await getAdminDb().collection('users').doc(userRecord.uid).set({
				email,
				displayName: name,
				phone,
				role: 'owner',
				createdAt: Timestamp.fromDate(new Date()),
				firstTimeMemorialVisit: true // Set firstTimeMemorialVisit to true on registration
			});
			console.log(`✅ User profile created for ${email} with owner role and firstTimeMemorialVisit=true 📝`);

			// 4. Create memorial
			console.log(`Attempting to create memorial for ${lovedOneName} in Firestore...`);
			const memorialData: Omit<Memorial, 'id'> = {
				lovedOneName: lovedOneName,
				slug,
				fullSlug,
				createdByUserId: userRecord.uid,
				creatorEmail: email,
				familyContactEmail: email,
				createdAt: Timestamp.fromDate(new Date()),
				updatedAt: Timestamp.fromDate(new Date()),
				creatorUid: userRecord.uid, // for legacy compatibility
				creatorName: name, // Added missing property
				isPublic: false, // Added missing property with a default value
				content: '', // Added missing property with a default value
				custom_html: '' // Added missing property with a default value
			};
			const memorialRef = await getAdminDb().collection('memorials').add(memorialData);
			console.log(`✅ Memorial created for ${lovedOneName} with slug: ${slug} (ID: ${memorialRef.id}) 🕊️`);

			// Index the new memorial in Algolia
			await indexMemorial({ ...memorialData, id: memorialRef.id } as Memorial);

			// 5. Send registration email
			// For now, we'll use the simple registration email.
			// TODO: In the future, we can expand this to use the enhanced email by collecting more data.
			await sendRegistrationEmail(email, password);

			// 6. Create a custom token for auto-login
			const customToken = await getAdminAuth().createCustomToken(userRecord.uid);
			console.log(`Custom token created for ${email} 🎟️`);

			// Set a cookie to indicate first-time memorial visit for the session
			cookies.set('first_visit_memorial_popup', 'true', {
				path: '/',
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				maxAge: 60 * 60 * 24 * 7 // 1 week
			});
			console.log('🍪 Set first_visit_memorial_popup cookie to true');

			// 7. Redirect to a client-side page to handle custom token login and session creation
			const redirectUrl = `/auth/login-with-token?token=${customToken}&slug=${slug}`;
			redirect(303, redirectUrl);
		} catch (error: any) {
			if (isRedirect(error)) {
				throw error;
			}
			console.error('❌ Error during registration process:', error);
			console.error('Error details:', {
				code: error.code,
				message: error.message,
				errorInfo: error.errorInfo
			});
			
			// Provide more specific error messages
			if (error.code === 'auth/email-already-exists') {
				return fail(400, { error: `An account with email ${email} already exists.` });
			} else if (error.code === 'auth/invalid-email') {
				return fail(400, { error: 'The email address is invalid.' });
			} else if (error.code === 'auth/weak-password') {
				return fail(400, { error: 'The password is too weak. Please try again.' });
			} else if (error.message?.includes('timeout')) {
				return fail(503, { error: 'Firebase service is temporarily unavailable. Please try again in a few moments.' });
			} else if (error.code === 'app/network-timeout') {
				return fail(503, { error: 'Network timeout - Firebase services may be slow. Please try again.' });
			}
			
			return fail(500, { error: `Registration failed: ${error.message || 'Unknown error occurred'}` });
		}

		return { success: true };
	}
};