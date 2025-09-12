import { adminAuth, adminDb } from '$lib/server/firebase';
import { fail, redirect, error as SvelteKitError } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { sendEnhancedRegistrationEmail } from '$lib/server/email';
import { indexMemorial } from '$lib/server/algolia-indexing';
import type { Memorial } from '$lib/types/memorial';

/**
 * LOAD FUNERAL DIRECTOR DATA
 * Secures the route and fetches the logged-in funeral director's profile.
 */
export const load: PageServerLoad = async ({ locals }) => {
	console.log('🔐 [FD-REG] Verifying user is a logged-in funeral director...');

	// 1. Check for logged-in user with 'funeral_director' role
	if (!locals.user || locals.user.role !== 'funeral_director') {
		console.log('🛑 [FD-REG] User not authorized. Redirecting to login.');
		redirect(303, '/login?redirect=/register/funeral-director');
	}

	const directorUid = locals.user.uid;
	console.log(`✅ [FD-REG] User ${directorUid} is authorized. Fetching director profile...`);

	try {
		// 2. Fetch the funeral director's specific profile from the 'funeral_directors' collection
		const directorDocSnap = await adminDb.collection('funeral_directors').doc(directorUid).get();

		if (!directorDocSnap.exists) {
			console.error(`❌ [FD-REG] No funeral director profile found for UID: ${directorUid}`);
						throw SvelteKitError(404, 'Your funeral director profile was not found. Please complete your registration or contact support.');
		}

		const directorData = directorDocSnap.data()!;
		const funeralDirector = {
			id: directorDocSnap.id,
			companyName: directorData.companyName || '',
			contactPerson: directorData.contactPerson || '',
			email: directorData.email || ''
		};

		console.log(`✅ [FD-REG] Successfully fetched profile for: ${funeralDirector.companyName}`);

		// 3. Return the specific funeral director's data
		return {
			funeralDirector
		};

	} catch (error) {
		console.error('❌ [FD-REG] Error loading funeral director profile:', error);
				throw SvelteKitError(500, 'Failed to load funeral director information.');
	}
};

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
	const slug = `celebration-of-life-for-${lovedOneName
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '')}`
		.substring(0, 100);
	return slug;
}

// Helper function to validate email format
function isValidEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

export const actions: Actions = {
	default: async ({ request, locals }) => {
		console.log('🎯 [FD-REG] Memorial registration started by funeral director');
		const data = await request.formData();

		// Security check: Ensure a logged-in funeral director is making the request
		if (!locals.user || locals.user.role !== 'funeral_director') {
			return fail(403, { error: 'You must be a logged-in funeral director to perform this action.' });
		}
		const directorUid = locals.user.uid;

		// Fetch the director's profile to get authoritative data
		const directorDoc = await adminDb.collection('funeral_directors').doc(directorUid).get();
		if (!directorDoc.exists) {
			return fail(404, { error: 'Funeral director profile not found.' });
		}
		const directorData = directorDoc.data()!;

		// Extract form data
		const lovedOneName = (data.get('lovedOneName') as string)?.trim();
		const familyContactName = (data.get('familyContactName') as string)?.trim();
		const familyContactEmail = (data.get('familyContactEmail') as string)?.trim();
		const familyContactPhone = (data.get('familyContactPhone') as string)?.trim();
		const locationName = (data.get('locationName') as string)?.trim();
		const locationAddress = (data.get('locationAddress') as string)?.trim();
		const memorialDate = (data.get('memorialDate') as string)?.trim();
		const memorialTime = (data.get('memorialTime') as string)?.trim();
		const contactPreference = (data.get('contactPreference') as string)?.trim() || 'email';
		const additionalNotes = (data.get('additionalNotes') as string)?.trim();

		// Validation
		const errors: Record<string, string> = {};
		if (!lovedOneName) errors.lovedOneName = "Loved one's name is required";
		if (!familyContactName) errors.familyContactName = 'Family contact name is required';
		if (!familyContactEmail || !isValidEmail(familyContactEmail)) {
			errors.familyContactEmail = 'A valid family contact email is required';
		}
		if (!familyContactPhone) errors.familyContactPhone = 'Family contact phone is required';

		if (Object.keys(errors).length > 0) {
			return fail(400, {
				data: Object.fromEntries(data.entries()), // Return submitted data
				errors
			});
		}

		const password = generateRandomPassword();
		const slug = generateSlug(lovedOneName);

		try {
			// 1. Create user for the family member
			const userRecord = await adminAuth.createUser({
				email: familyContactEmail,
				password,
				displayName: familyContactName
			});

			// 2. Set 'owner' role for the new family member user
			await adminAuth.setCustomUserClaims(userRecord.uid, { role: 'owner' });

			// 3. Create user profile in Firestore for the family member
			const userProfile = {
				email: familyContactEmail,
				displayName: familyContactName,
				phone: familyContactPhone,
				role: 'owner',
				createdAt: new Date(),
				createdByFuneralDirector: directorUid
			};
			await adminDb.collection('users').doc(userRecord.uid).set(userProfile);

			// 4. Create the memorial, assigning the FD as the manager
			const memorialData = {
				lovedOneName,
				slug,
				ownerUid: userRecord.uid, // The family member owns the memorial
				funeralDirectorUid: directorUid, // The logged-in FD manages it
				creatorEmail: directorData.email,
				creatorName: directorData.contactPerson,
				directorFullName: directorData.contactPerson,
				funeralHomeName: directorData.companyName,
				directorEmail: directorData.email,
				memorialDate: memorialDate || null,
				memorialTime: memorialTime || null,
				memorialLocationName: locationName || null,
				memorialLocationAddress: locationAddress || null,
				familyContactName,
				familyContactEmail,
				familyContactPhone,
				familyContactPreference: contactPreference,
				additionalNotes: additionalNotes || null,
				isPublic: true,
				createdAt: new Date(),
				updatedAt: new Date()
			};
			const memorialRef = await adminDb.collection('memorials').add(memorialData);

			// 5. Index in Algolia
			await indexMemorial({ ...memorialData, id: memorialRef.id } as unknown as Memorial);

			// 6. Send registration email to the family member
			await sendEnhancedRegistrationEmail({
				email: familyContactEmail,
				lovedOneName,
				memorialUrl: `https://yoursite.com/tributes/${slug}`,
				ownerName: familyContactName,
				password // Pass the generated password
			});

			// 7. Return success with the shareable link
			return {
				success: true,
				memorialLink: `/tributes/${slug}`
			};

		} catch (error: any) {
			let errorMessage = 'An unexpected error occurred.';
			if (error.code === 'auth/email-already-exists') {
				errorMessage = `An account with email ${familyContactEmail} already exists.`;
			} else if (error.message) {
				errorMessage = `Registration failed: ${error.message}`;
			}
			return fail(500, { error: errorMessage });
		}
	}
};