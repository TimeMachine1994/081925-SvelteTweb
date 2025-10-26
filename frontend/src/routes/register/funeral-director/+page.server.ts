import { adminAuth, adminDb } from '$lib/server/firebase';
import { fail, redirect, isRedirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { sendEnhancedRegistrationEmail } from '$lib/server/email';
import type { EnhancedRegistrationEmailData } from '$lib/server/email';
import { indexMemorial } from '$lib/server/algolia-indexing';
import type { Memorial } from '$lib/types/memorial';

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
	default: async ({ request, locals }) => {
		console.log('👨‍⚕️ [QUICK FAMILY REG] Processing quick family registration');

		try {
			// Verify authentication
			if (!locals.user) {
				return fail(401, { error: 'Authentication required' });
			}

			// Verify user is a funeral director or admin
			if (locals.user.role !== 'funeral_director' && locals.user.role !== 'admin') {
				return fail(403, { error: 'Funeral director or admin access required' });
			}

			const formData = await request.formData();
			const lovedOneName = formData.get('lovedOneName')?.toString();
			const familyEmail = formData.get('familyEmail')?.toString();
			const serviceDate = formData.get('serviceDate')?.toString();
			const serviceTime = formData.get('serviceTime')?.toString();

			if (!lovedOneName || !familyEmail || !serviceDate || !serviceTime) {
				return fail(400, { error: 'All fields are required' });
			}

			// Validate email format
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(familyEmail)) {
				return fail(400, { error: 'Please enter a valid email address' });
			}

			// Get funeral director profile
			let funeralDirector = null;
			if (locals.user.role === 'funeral_director') {
				const funeralDirectorDoc = await adminDb
					.collection('funeral_directors')
					.doc(locals.user.uid)
					.get();

				if (!funeralDirectorDoc.exists) {
					return fail(404, { error: 'Funeral director profile not found' });
				}
				funeralDirector = funeralDirectorDoc.data();
			}

			// Generate temporary password for family
			const tempPassword = Math.random().toString(36).slice(-8);

			// Create user account for family
			const userRecord = await adminAuth.createUser({
				email: familyEmail,
				password: tempPassword,
				displayName: `Family of ${lovedOneName}`
			});

			// Set custom claims for the new user
			await adminAuth.setCustomUserClaims(userRecord.uid, {
				role: 'owner'
			});

			// Create user profile in Firestore
			await adminDb
				.collection('users')
				.doc(userRecord.uid)
				.set({
					email: familyEmail,
					displayName: `Family of ${lovedOneName}`,
					role: 'owner',
					createdAt: Timestamp.now(),
					createdBy: locals.user.uid,
					createdByFuneralDirector: true
				});

			// Parse loved one's name
			const nameParts = lovedOneName.trim().split(' ');
			const firstName = nameParts[0] || '';
			const lastName = nameParts.slice(1).join(' ') || '';

			// Create memorial slug
			const baseSlug = `${firstName}-${lastName}`
				.toLowerCase()
				.replace(/[^a-z0-9\s-]/g, '')
				.replace(/\s+/g, '-')
				.replace(/-+/g, '-')
				.trim();

			const timestamp = Date.now().toString().slice(-4);
			const memorialSlug = `${baseSlug}-${timestamp}`;

			// Combine service date and time
			const serviceDateTime = new Date(`${serviceDate}T${serviceTime}`);

			// Create memorial
			const memorialRef = adminDb.collection('memorials').doc();
			await memorialRef.set({
				title: `In Memory of ${lovedOneName}`,
				slug: memorialSlug,
				fullSlug: memorialSlug,
				lovedOneName: lovedOneName,
				deceased: {
					firstName: firstName,
					lastName: lastName,
					fullName: lovedOneName
				},
				ownerId: userRecord.uid,
				ownerEmail: familyEmail,
				creatorUid: userRecord.uid,

				// Funeral director info
				funeralDirectorId: locals.user.role === 'funeral_director' ? locals.user.uid : null,
				funeralDirectorName: funeralDirector?.companyName || 'Funeral Director',
				managedByFuneralDirector: locals.user.role === 'funeral_director',

				// Service info
				serviceDate: Timestamp.fromDate(serviceDateTime),
				serviceTime: serviceTime,

				// Settings
				isPublic: true,
				allowComments: true,
				allowPhotos: true,
				allowTributes: true,

				// Timestamps
				createdAt: Timestamp.now(),
				updatedAt: Timestamp.now(),

				// Status
				status: 'active'
			});

			// Send welcome email to the family
			try {
				await sendEnhancedRegistrationEmail({
					email: familyEmail,
					password: tempPassword,
					lovedOneName: lovedOneName,
					memorialUrl: `https://tributestream.com/${memorialSlug}`,
					ownerName: `Family of ${lovedOneName}`
				});
				console.log('📧 Welcome email sent to family successfully.');
			} catch (emailError) {
				console.error('⚠️ Failed to send welcome email:', emailError);
				// Do not fail the entire request if email sending fails
			}

			return {
				success: true,
				message: 'Family memorial created successfully! Welcome email sent to family.',
				memorialId: memorialRef.id,
				memorialSlug: memorialSlug,
				memorialUrl: `/${memorialSlug}`,
				familyEmail: familyEmail
			};
		} catch (error: any) {
			console.error('Quick family registration error:', error);
			
			// Handle specific Firebase Auth errors
			if (error?.code === 'auth/email-already-exists') {
				return fail(400, { error: 'An account with this email already exists. Please use a different email address.' });
			}
			
			return fail(500, { error: 'Failed to create family memorial. Please try again.' });
		}
	}
};
