import { adminAuth, adminDb } from '$lib/server/firebase';
import { fail, redirect, isRedirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { sendRegistrationEmail } from '$lib/server/email';
import { indexMemorial } from '$lib/server/algolia-indexing';
import type { Memorial } from '$lib/types/memorial';
import { validateMultipleEmails } from '$lib/utils/email-validation';
import { generateUniqueMemorialSlug } from '$lib/utils/memorial-slug';
import { createStandardUserProfile } from '$lib/utils/user-profile';

/**
 * ENHANCED FUNERAL DIRECTOR REGISTRATION PAGE
 *
 * Allows funeral directors to register families with comprehensive
 * memorial and service information
 */

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


export const load: PageServerLoad = async ({ locals }) => {
	// Check if user is logged in
	if (!locals.user) {
		throw redirect(302, '/login?redirect=/register/funeral-director');
	}

	// Check if user has proper role (funeral director or admin)
	if (locals.user.role !== 'funeral_director' && locals.user.role !== 'admin') {
		throw redirect(302, '/profile?error=access-denied');
	}

	// Get funeral director profile for prepopulation
	let funeralDirectorProfile = null;
	let prepopulatedData = {
		directorName: '',
		directorEmail: '',
		funeralHomeName: ''
	};

	if (locals.user.role === 'funeral_director') {
		try {
			const fdDoc = await adminDb
				.collection('funeral_directors')
				.doc(locals.user.uid)
				.get();
			if (fdDoc.exists) {
				funeralDirectorProfile = fdDoc.data();
				
				// Prepopulate form data from funeral director profile
				prepopulatedData = {
					directorName: funeralDirectorProfile?.contactPerson || locals.user.displayName || '',
					directorEmail: funeralDirectorProfile?.email || locals.user.email || '',
					funeralHomeName: funeralDirectorProfile?.companyName || ''
				};
			}
		} catch (error) {
			console.error('Failed to fetch funeral director profile:', error);
		}
	} else if (locals.user.role === 'admin') {
		// For admin users, just use their basic info
		prepopulatedData = {
			directorName: locals.user.displayName || '',
			directorEmail: locals.user.email || '',
			funeralHomeName: ''
		};
	}

	return {
		user: locals.user,
		funeralDirectorProfile,
		prepopulatedData
	};
};

export const actions: Actions = {
	default: async ({ request }) => {
		console.log('🎯 Enhanced funeral director registration started');
		const data = await request.formData();
		
		// Extract all form fields
		console.log('📝 Extracting form data...');
		const lovedOneName = (data.get('lovedOneName') as string)?.trim();
		const familyContactName = (data.get('familyContactName') as string)?.trim();
		const familyContactEmail = (data.get('familyContactEmail') as string)?.trim();
		const familyContactPhone = (data.get('familyContactPhone') as string)?.trim();
		const directorName = (data.get('directorName') as string)?.trim();
		const directorEmail = (data.get('directorEmail') as string)?.trim();
		const funeralHomeName = (data.get('funeralHomeName') as string)?.trim();
		const locationName = (data.get('locationName') as string)?.trim();
		const locationAddress = (data.get('locationAddress') as string)?.trim();
		const memorialDate = (data.get('memorialDate') as string)?.trim();
		const memorialTime = (data.get('memorialTime') as string)?.trim();
		const contactPreference = (data.get('contactPreference') as string)?.trim() || 'email';
		const additionalNotes = (data.get('additionalNotes') as string)?.trim();

		console.log('📋 Form data extracted:', {
			lovedOneName,
			familyContactName,
			familyContactEmail,
			directorName,
			funeralHomeName,
			hasLocationInfo: !!(locationName || locationAddress),
			hasScheduleInfo: !!(memorialDate || memorialTime),
			contactPreference
		});

		// Enhanced validation for required fields
		console.log('🔍 Validating required fields...');
		const validationErrors: string[] = [];

		if (!lovedOneName) validationErrors.push('Loved one\'s name is required');
		if (!directorName) validationErrors.push('Director name is required');
		if (!familyContactEmail) validationErrors.push('Family contact email is required');
		if (!familyContactPhone) validationErrors.push('Family contact phone is required');
		if (!funeralHomeName) validationErrors.push('Funeral home name is required');

		if (validationErrors.length > 0) {
			console.log('❌ Validation failed:', validationErrors);
			return fail(400, { error: `Validation failed: ${validationErrors.join(', ')}` });
		}

		// Pre-validate emails before expensive operations
		// Only validate family contact email since that's the only one creating a new account
		console.log('🔍 Pre-validating family contact email...');
		const emailsToValidate = [
			{ email: familyContactEmail, fieldName: 'familyContactEmail' }
		];
		
		// Note: Director email is NOT validated for uniqueness since it's just metadata
		// and not used to create a new Firebase Auth account

		const emailValidation = await validateMultipleEmails(emailsToValidate);
		if (!emailValidation.isValid) {
			console.log('❌ Email validation failed:', emailValidation.errors);
			const firstError = emailValidation.errors[0];
			return fail(400, { 
				error: firstError.error,
				field: firstError.field
			});
		}

		console.log('✅ All validation passed successfully');

		const password = generateRandomPassword();
		const fullSlug = await generateUniqueMemorialSlug(lovedOneName);

		try {
			// 1. Create user in Firebase Auth using family contact email as primary
			console.log(`👤 Creating user account with family contact email: ${familyContactEmail}`);
			const userRecord = await adminAuth.createUser({
				email: familyContactEmail, // Use family contact email as primary
				password,
				displayName: familyContactName || directorName // Prefer family contact name
			});
			console.log(`✅ User created successfully: ${userRecord.uid}`);

			// 2. Set custom claim for owner role
			console.log('👑 Setting owner role claim...');
			await adminAuth.setCustomUserClaims(userRecord.uid, { role: 'owner' });
			console.log(`✅ Custom claim 'owner' set for ${familyContactEmail}`);

			// 3. Create enhanced user profile in Firestore
			console.log('📝 Creating enhanced user profile...');
			const userProfile = createStandardUserProfile({
				email: familyContactEmail,
				displayName: familyContactName || directorName,
				phone: familyContactPhone,
				funeralHomeName,
				role: 'owner',
				directorEmail: directorEmail || undefined,
				familyContactName: familyContactName,
				familyContactPhone: familyContactPhone,
				contactPreference: contactPreference as 'phone' | 'email',
				createdByFuneralDirector: true
			});

			await adminDb.collection('users').doc(userRecord.uid).set(userProfile);
			console.log(`✅ Enhanced user profile created for ${familyContactEmail}`);

			// 4. Create comprehensive memorial with all service details
			console.log('🕊️ Creating comprehensive memorial...');
			const memorialData = {
				// Core memorial fields
				lovedOneName: lovedOneName,
				slug: fullSlug, // Use fullSlug as slug for consistency
				fullSlug: fullSlug,
				ownerUid: userRecord.uid, // Required field
				createdByUserId: userRecord.uid,
				creatorEmail: familyContactEmail,
				creatorName: familyContactName || directorName,
				
				// Service information structure (required)
				services: {
					main: {
						location: {
							name: locationName || '',
							address: locationAddress || '',
							isUnknown: !locationName
						},
						time: {
							date: memorialDate || null,
							time: memorialTime || null,
							isUnknown: !memorialDate || !memorialTime
						},
						hours: 2 // Default duration
					},
					additional: [] // Empty initially
				},
				
				// Service information fields (legacy)
				directorFullName: directorName,
				funeralHomeName: funeralHomeName,
				memorialDate: memorialDate || null,
				memorialTime: memorialTime || null,
				memorialLocationName: locationName || null,
				memorialLocationAddress: locationAddress || null,
				
				// Family contact fields
				familyContactName: familyContactName,
				familyContactEmail: familyContactEmail,
				familyContactPhone: familyContactPhone,
				familyContactPreference: contactPreference as 'phone' | 'email',
				
				// Director information
				directorEmail: directorEmail || null,
				
				// Additional information
				additionalNotes: additionalNotes || null,
				
				// Required fields
				isPublic: true,
				isComplete: false, // Required field
				content: '',
				custom_html: null,
				
				// Timestamps
				createdAt: new Date(),
				updatedAt: new Date(),
				
				// Legacy compatibility
				creatorUid: userRecord.uid // Keep for backward compatibility
			};

			const memorialRef = await adminDb.collection('memorials').add(memorialData);
			console.log(`✅ Comprehensive memorial created for ${lovedOneName} with ID: ${memorialRef.id}`);
			console.log(`🔗 Memorial fullSlug: ${fullSlug}`);

			// Index the new memorial in Algolia
			await indexMemorial({ ...memorialData, id: memorialRef.id } as unknown as Memorial);

			// 5. Send registration email
			console.log('📧 Sending registration email...');
			await sendRegistrationEmail(familyContactEmail, password, lovedOneName);
			console.log('✅ Registration email sent successfully');

			// 6. Create a custom token for auto-login
			console.log('🎟️ Creating custom token for auto-login...');
			const customToken = await adminAuth.createCustomToken(userRecord.uid);
			console.log(`✅ Custom token created for ${familyContactEmail}`);

			// 7. Redirect to the memorial page directly
			const memorialUrl = `/${fullSlug}`;
			console.log(`🚀 Redirecting to memorial page: ${memorialUrl}`);
			
			console.log('🎉 Enhanced funeral director registration completed successfully!');
			throw redirect(303, memorialUrl);
			
		} catch (error: any) {
			if (isRedirect(error)) {
				throw error;
			}
			
			console.error('💥 Error during enhanced registration process:', error);
			
			// Enhanced error handling with specific messages
			let errorMessage = 'Registration failed. Please try again.';
			let fieldName = undefined;
			
			// Since we pre-validated email, this should rarely happen
			if (error.code === 'auth/email-already-exists') {
				errorMessage = `An account with email ${familyContactEmail} already exists. Please use a different email or sign in to your existing account.`;
				fieldName = 'familyContactEmail';
			} else if (error.code === 'auth/invalid-email') {
				errorMessage = 'The provided email address is invalid. Please check and try again.';
				fieldName = 'familyContactEmail';
			} else if (error.code === 'auth/weak-password') {
				errorMessage = 'The generated password is too weak. Please try again.';
			} else if (error.message?.includes('PERMISSION_DENIED')) {
				errorMessage = 'Database permission denied. Please contact support.';
			} else if (error.message?.includes('QUOTA_EXCEEDED')) {
				errorMessage = 'Service quota exceeded. Please try again later.';
			}
			
			console.error('❌ Specific error details:', {
				code: error.code,
				message: error.message,
				stack: error.stack
			});
			
			return fail(500, { 
				error: errorMessage,
				...(fieldName && { field: fieldName })
			});
		}
	}
};
