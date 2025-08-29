import { getAdminAuth, getAdminDb } from '$lib/server/firebase';
import { fail, redirect, isRedirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { sendEnhancedRegistrationEmail } from '$lib/server/email';
import type { EnhancedRegistrationEmailData } from '$lib/server/email';
import { Timestamp } from 'firebase-admin/firestore'; // Import Timestamp
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

// Helper function to validate email format
function isValidEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

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

		// Email format validation
		if (familyContactEmail && !isValidEmail(familyContactEmail)) {
			validationErrors.push('Family contact email must be a valid email address');
		}
		if (directorEmail && !isValidEmail(directorEmail)) {
			validationErrors.push('Director email must be a valid email address');
		}

		if (validationErrors.length > 0) {
			console.log('❌ Validation failed:', validationErrors);
			return fail(400, { error: `Validation failed: ${validationErrors.join(', ')}` });
		}

		console.log('✅ All required fields validated successfully');

		const password = generateRandomPassword();
		const slug = generateSlug(lovedOneName);
		const fullSlug = `tributes/${slug}`;

		try {
			// 1. Create user in Firebase Auth using family contact email as primary
			console.log(`👤 Creating user account with family contact email: ${familyContactEmail}`);
			const userRecord = await getAdminAuth().createUser({
				email: familyContactEmail, // Use family contact email as primary
				password,
				displayName: familyContactName || directorName // Prefer family contact name
			});
			console.log(`✅ User created successfully: ${userRecord.uid}`);

			// 2. Set custom claim for owner role
			console.log('👑 Setting owner role claim...');
			await getAdminAuth().setCustomUserClaims(userRecord.uid, { role: 'owner' });
			console.log(`✅ Custom claim 'owner' set for ${familyContactEmail}`);

			// 3. Create enhanced user profile in Firestore
			console.log('📝 Creating enhanced user profile...');
			const userProfile = {
				email: familyContactEmail,
				displayName: familyContactName || directorName,
				phone: familyContactPhone,
				funeralHomeName,
				role: 'owner',
				createdAt: Timestamp.fromDate(new Date()),
				// Enhanced director information
				directorEmail: directorEmail || null,
				directorName: directorName,
				familyContactName: familyContactName,
				familyContactPhone: familyContactPhone,
				contactPreference: contactPreference as 'phone' | 'email'
			};

			await getAdminDb().collection('users').doc(userRecord.uid).set(userProfile);
			console.log(`✅ Enhanced user profile created for ${familyContactEmail}`);

			// 4. Create comprehensive memorial with all service details
			console.log('🕊️ Creating comprehensive memorial...');
			const memorialData = {
				// Core memorial fields
				lovedOneName: lovedOneName,
				slug: slug,
				fullSlug: fullSlug,
				createdByUserId: userRecord.uid,
				creatorEmail: familyContactEmail,
				creatorName: familyContactName || directorName,
				
				// Service information fields
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
				
				// Default values
				isPublic: true,
				content: '',
				custom_html: null,
				
				// Timestamps
				createdAt: Timestamp.fromDate(new Date()),
				updatedAt: Timestamp.fromDate(new Date()),
				
				// Legacy compatibility
				creatorUid: userRecord.uid // Keep for backward compatibility
			};

			const memorialRef = await getAdminDb().collection('memorials').add(memorialData);
			console.log(`✅ Comprehensive memorial created for ${lovedOneName} with ID: ${memorialRef.id}`);
			console.log(`🔗 Memorial slug: ${slug}, Full slug: ${fullSlug}`);

			// Index the new memorial in Algolia
			await indexMemorial({ ...memorialData, id: memorialRef.id } as Memorial);

			// 5. Send enhanced registration email
			console.log('📧 Sending enhanced registration email...');
			await sendEnhancedRegistrationEmail({
				email: familyContactEmail,
				password,
				lovedOneName,
				tributeUrl: `https://yoursite.com/tributes/celebration-of-life-for-${slug}`,
				familyContactName,
				familyContactEmail,
				familyContactPhone,
				contactPreference: contactPreference as 'phone' | 'email',
				directorName,
				directorEmail,
				funeralHomeName,
				memorialDate,
				memorialTime,
				locationName,
				locationAddress,
				additionalNotes
			});
			console.log('✅ Enhanced registration email sent successfully');

			// 6. Create a custom token for auto-login
			console.log('🎟️ Creating custom token for auto-login...');
			const customToken = await getAdminAuth().createCustomToken(userRecord.uid);
			console.log(`✅ Custom token created for ${familyContactEmail}`);

			// 7. Redirect to the session creation page with enhanced parameters
			const redirectUrl = `/auth/session?token=${customToken}&slug=${slug}`;
			console.log(`🚀 Redirecting to: ${redirectUrl}`);
			
			console.log('🎉 Enhanced funeral director registration completed successfully!');
			redirect(303, redirectUrl);
			
		} catch (error: any) {
			if (isRedirect(error)) {
				throw error;
			}
			
			console.error('💥 Error during enhanced registration process:', error);
			
			// Enhanced error handling with specific messages
			let errorMessage = 'An unexpected error occurred during registration.';
			
			if (error.code === 'auth/email-already-exists') {
				errorMessage = `An account with email ${familyContactEmail} already exists. Please use a different email or contact support.`;
			} else if (error.code === 'auth/invalid-email') {
				errorMessage = 'The provided email address is invalid. Please check and try again.';
			} else if (error.code === 'auth/weak-password') {
				errorMessage = 'The generated password is too weak. Please try again.';
			} else if (error.message?.includes('PERMISSION_DENIED')) {
				errorMessage = 'Database permission denied. Please contact support.';
			} else if (error.message?.includes('QUOTA_EXCEEDED')) {
				errorMessage = 'Service quota exceeded. Please try again later.';
			} else if (error.message) {
				errorMessage = `Registration failed: ${error.message}`;
			}
			
			console.error('❌ Specific error details:', {
				code: error.code,
				message: error.message,
				stack: error.stack
			});
			
			return fail(500, { error: errorMessage });
		}
	}
};