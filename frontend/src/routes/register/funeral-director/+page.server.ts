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
	console.log('🔐 [FD-REG] Loading funeral director registration page...');

	// Check if user is already logged in as funeral director
	if (locals.user && locals.user.role === 'funeral_director') {
		const directorUid = locals.user.uid;
		console.log(`✅ [FD-REG] User ${directorUid} is authorized. Fetching director profile...`);

		try {
			// Fetch the funeral director's specific profile from the 'funeral_directors' collection
			const directorDocSnap = await adminDb.collection('funeral_directors').doc(directorUid).get();

			if (!directorDocSnap.exists) {
				console.error(`❌ [FD-REG] No funeral director profile found for UID: ${directorUid}`);
				throw SvelteKitError(
					404,
					'Your funeral director profile was not found. Please complete your registration or contact support.'
				);
			}

			const directorData = directorDocSnap.data()!;
			const funeralDirector = {
				id: directorDocSnap.id,
				companyName: directorData.companyName || '',
				contactPerson: directorData.contactPerson || '',
				email: directorData.email || ''
			};

			console.log(`✅ [FD-REG] Successfully fetched profile for: ${funeralDirector.companyName}`);

			return {
				funeralDirector,
				isExistingDirector: true
			};
		} catch (error) {
			console.error('❌ [FD-REG] Error loading funeral director profile:', error);
			throw SvelteKitError(500, 'Failed to load funeral director information.');
		}
	}

	// For new registrations, return empty data - prefilled data will come from sessionStorage
	console.log('📝 [FD-REG] New funeral director registration');
	return {
		funeralDirector: null,
		isExistingDirector: false
	};
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

// Helper function to generate fullSlug from loved one's name
function generateFullSlug(lovedOneName: string): string {
	const fullSlug = `celebration-of-life-for-${lovedOneName
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '')}`.substring(0, 100);
	return fullSlug;
}

// Helper function to validate email format
function isValidEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

export const actions: Actions = {
	registerFuneralDirector: async ({ request }) => {
		console.log('🏛️ [FD-REG] Funeral director registration started');
		const data = await request.formData();

		// Extract form data
		const name = (data.get('name') as string)?.trim();
		const email = (data.get('email') as string)?.trim();
		const password = (data.get('password') as string)?.trim();
		const companyName = (data.get('companyName') as string)?.trim();
		const phone = (data.get('phone') as string)?.trim();
		const licenseNumber = (data.get('licenseNumber') as string)?.trim();

		// Validation
		if (!name || !email || !password || !companyName) {
			return fail(400, {
				message: 'Name, email, password, and company name are required'
			});
		}

		if (!isValidEmail(email)) {
			return fail(400, {
				message: 'Please enter a valid email address'
			});
		}

		try {
			// Create Firebase user
			const userRecord = await adminAuth.createUser({
				email,
				password,
				displayName: name
			});

			// Set custom claims for funeral director role
			await adminAuth.setCustomUserClaims(userRecord.uid, {
				role: 'funeral_director',
				isFuneralDirector: true
			});

			// Create user profile in users collection
			await adminDb.collection('users').doc(userRecord.uid).set({
				email,
				displayName: name,
				role: 'funeral_director',
				isFuneralDirector: true,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			});

			// Create funeral director profile in funeral_directors collection
			await adminDb
				.collection('funeral_directors')
				.doc(userRecord.uid)
				.set({
					email,
					contactPerson: name,
					companyName,
					phone: phone || '',
					licenseNumber: licenseNumber || '',
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
					isActive: true
				});

			console.log(`✅ [FD-REG] Funeral director created successfully: ${email}`);

			// Create custom token for immediate login
			const customToken = await adminAuth.createCustomToken(userRecord.uid);

			return {
				success: true,
				customToken
			};
		} catch (error: any) {
			console.error('❌ [FD-REG] Error creating funeral director:', error);
			let errorMessage = 'Registration failed. Please try again.';

			if (error.code === 'auth/email-already-exists') {
				errorMessage = 'An account with this email already exists.';
			} else if (error.code === 'auth/weak-password') {
				errorMessage = 'Password should be at least 6 characters.';
			} else if (error.message) {
				errorMessage = error.message;
			}

			return fail(400, {
				message: errorMessage
			});
		}
	},
	createMemorial: async ({ request, locals }) => {
		console.log('🎯 [FD-REG] Memorial registration started by funeral director');
		
		try {
			const data = await request.formData();
			console.log('📝 [FD-REG] Form data received:', Object.fromEntries(data.entries()));

			// Security check: Ensure a logged-in funeral director is making the request
			if (!locals.user || locals.user.role !== 'funeral_director') {
				console.error('❌ [FD-REG] Unauthorized access attempt');
				return fail(403, {
					error: 'You must be a logged-in funeral director to perform this action.'
				});
			}
			const directorUid = locals.user.uid;
			console.log('✅ [FD-REG] Authorized funeral director:', directorUid);

			// Fetch the director's profile to get authoritative data
			console.log('🔍 [FD-REG] Fetching director profile...');
			const directorDoc = await adminDb.collection('funeral_directors').doc(directorUid).get();
			if (!directorDoc.exists) {
				console.error('❌ [FD-REG] Director profile not found for UID:', directorUid);
				return fail(404, { error: 'Funeral director profile not found.' });
			}
			const directorData = directorDoc.data()!;
			console.log('✅ [FD-REG] Director profile found:', directorData.companyName);

			// Extract form data
			console.log('📋 [FD-REG] Extracting form data...');
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
			
			console.log('📝 [FD-REG] Extracted data:', {
				lovedOneName,
				familyContactName,
				familyContactEmail,
				familyContactPhone
			});

			// Validation
			console.log('✅ [FD-REG] Validating form data...');
			const errors: Record<string, string> = {};
			if (!lovedOneName) errors.lovedOneName = "Loved one's name is required";
			if (!familyContactName) errors.familyContactName = 'Family contact name is required';
			if (!familyContactEmail || !isValidEmail(familyContactEmail)) {
				errors.familyContactEmail = 'A valid family contact email is required';
			}
			if (!familyContactPhone) errors.familyContactPhone = 'Family contact phone is required';

			if (Object.keys(errors).length > 0) {
				console.error('❌ [FD-REG] Validation errors:', errors);
				return fail(400, {
					data: Object.fromEntries(data.entries()), // Return submitted data
					errors
				});
			}

			const password = generateRandomPassword();
			const fullSlug = generateFullSlug(lovedOneName);
			
			console.log('🔐 [FD-REG] Creating Firebase user for family member...');
			// 1. Create user for the family member
			const userRecord = await adminAuth.createUser({
				email: familyContactEmail,
				password,
				displayName: familyContactName
			});
			console.log('✅ [FD-REG] Firebase user created:', userRecord.uid);

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

			// 4. Create the memorial with new services structure
			const memorialData = {
				lovedOneName,
				fullSlug, // Use clean fullSlug without timestamp
				ownerUid: userRecord.uid, // The family member owns the memorial
				funeralDirectorUid: directorUid, // The logged-in FD manages it
				creatorEmail: directorData.email,
				familyContactEmail,

				// New services structure
				services: {
					main: {
						location: {
							name: locationName || '',
							address: locationAddress || '',
							isUnknown: !locationName && !locationAddress
						},
						time: {
							date: memorialDate || null,
							time: memorialTime || null,
							isUnknown: !memorialDate && !memorialTime
						},
						hours: 2 // Default duration
					},
					additional: [] // Empty initially
				},

				// Funeral director information
				funeralDirector: {
					id: directorUid,
					companyName: directorData.companyName,
					contactPerson: directorData.contactPerson,
					phone: directorData.phone || '',
					email: directorData.email
				},

				// Family contact information
				family: {
					primaryContact: {
						name: familyContactName,
						email: familyContactEmail,
						phone: familyContactPhone,
						contactPreference: contactPreference
					}
				},

				// Memorial settings
				isPublic: true,
				content: additionalNotes || '',
				custom_html: null,

				createdAt: new Date(),
				updatedAt: new Date()
			};
			const memorialRef = await adminDb.collection('memorials').add(memorialData);

			// 5. Index in Algolia (non-blocking)
			try {
				await indexMemorial({ ...memorialData, id: memorialRef.id } as unknown as Memorial);
				console.log('✅ [FD-REG] Memorial indexed in Algolia successfully');
			} catch (error) {
				console.error('⚠️ [FD-REG] Failed to index memorial in Algolia:', error);
				// Don't fail the entire operation for search indexing
			}

			// 6. Send registration email to the family member (non-blocking)
			try {
				await sendEnhancedRegistrationEmail({
					email: familyContactEmail,
					lovedOneName,
					memorialUrl: `https://tributestream.com/${fullSlug}`,
					ownerName: familyContactName,
					password // Pass the generated password
				});
				console.log('✅ [FD-REG] Registration email sent successfully');
			} catch (error) {
				console.error('⚠️ [FD-REG] Failed to send registration email:', error);
				// Don't fail the entire operation for email sending
			}

			// 7. Return success with the shareable link
			return {
				success: true,
				memorialLink: `/${fullSlug}`
			};
		} catch (error: any) {
			console.error('💥 [FD-REG] Unexpected error during memorial creation:', error);
			let errorMessage = 'An unexpected error occurred.';
			if (error.code === 'auth/email-already-exists') {
				errorMessage = `An account with this email already exists.`;
			} else if (error.message) {
				errorMessage = `Registration failed: ${error.message}`;
			}
			return fail(500, { error: errorMessage });
		}
	}
};
