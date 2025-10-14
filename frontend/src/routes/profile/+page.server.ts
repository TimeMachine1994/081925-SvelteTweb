import { adminDb } from '$lib/server/firebase';
import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import type { Memorial } from '$lib/types/memorial';
import { verifyRecaptcha, RECAPTCHA_ACTIONS, getScoreThreshold } from '$lib/utils/recaptcha';

// Helper function to convert Timestamps and Dates to strings
function sanitizeData(data: any): any {
	if (!data) return data;
	if (Array.isArray(data)) return data.map(sanitizeData);
	if (typeof data === 'object' && data !== null) {
		if (data.toDate && typeof data.toDate === 'function') return data.toDate().toISOString(); // Firestore Timestamp
		if (data instanceof Date) return data.toISOString(); // JavaScript Date

		const sanitized: { [key: string]: any } = {};
		for (const key in data) {
			sanitized[key] = sanitizeData(data[key]);
		}
		return sanitized;
	}
	return data;
}

export const load: PageServerLoad = async ({ locals }) => {
	try {
		if (!locals.user) {
			throw redirect(303, '/login');
		}

		const { uid, role } = locals.user;

		// Fetch user profile
		const userDoc = await adminDb.collection('users').doc(uid).get();
		const profileData = userDoc.data();

		// Fetch funeral director profile if user is a funeral director
		let funeralDirectorData = null;
		if (role === 'funeral_director') {
			const directorDoc = await adminDb.collection('funeral_directors').doc(uid).get();
			if (directorDoc.exists) {
				funeralDirectorData = directorDoc.data();
			}
		}

		// Fetch memorials based on role
		let memorials: Memorial[] = [];
		if (role === 'funeral_director') {
			const memorialsSnap = await adminDb
				.collection('memorials')
				.where('funeralDirectorUid', '==', uid)
				.get();
			memorials = memorialsSnap.docs.map((doc) => {
				const data = doc.data();
				if (!data.fullSlug && data.slug) {
					data.fullSlug = data.slug;
				}
				return { id: doc.id, ...data } as Memorial;
			});
		} else if (role === 'owner') {
			const memorialsSnap = await adminDb
				.collection('memorials')
				.where('ownerUid', '==', uid)
				.get();
			memorials = memorialsSnap.docs.map((doc) => {
				const data = doc.data();
				if (!data.fullSlug && data.slug) {
					data.fullSlug = data.slug;
				}
				return { id: doc.id, ...data } as Memorial;
			});
		}
		// Add other roles as needed

		return {
			profile: {
				email: locals.user.email,
				displayName: profileData?.displayName || locals.user.displayName,
				hasPaidForMemorial: profileData?.hasPaidForMemorial || false,
				memorialCount: profileData?.memorialCount || 0
			},
			user: {
				role: locals.user.role,
				uid: locals.user.uid
			},
			funeralDirector: funeralDirectorData ? sanitizeData(funeralDirectorData) : null,
			memorials: sanitizeData(memorials)
		};
	} catch (error) {
		console.error('Profile load error:', error);
		return fail(500, { error: 'Failed to load profile data.' });
	}
};

export const actions: Actions = {
	testAction: async ({ request, locals }) => {
		console.log('🧪 [PROFILE_SERVER] Test action called successfully!');
		console.log('🧪 [PROFILE_SERVER] User:', locals.user);
		return { success: true, message: 'Test action works!' };
	},
	updateProfile: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { message: 'Unauthorized' });
		}

		const data = await request.formData();
		const displayName = data.get('displayName');

		if (!displayName) {
			return fail(400, { message: 'Display name is required' });
		}

		try {
			await adminDb.collection('users').doc(locals.user.uid).set(
				{
					displayName: displayName.toString()
				},
				{ merge: true }
			);
		} catch (error) {
			return fail(500, { message: 'Error updating profile' });
		}

		return {
			message: 'Profile updated successfully'
		};
	},
	createMemorial: async ({ request, locals }) => {
		console.log('🎯 [PROFILE_SERVER] createMemorial action called');
		console.log('🎯 [PROFILE_SERVER] User:', locals.user);
		
		if (!locals.user || locals.user.role !== 'owner') {
			console.error('❌ [PROFILE_SERVER] Unauthorized user or not owner:', locals.user);
			return fail(401, { message: 'Only owners can create memorials' });
		}

		const data = await request.formData();
		const recaptchaToken = data.get('recaptchaToken');

		// Verify reCAPTCHA
		if (recaptchaToken) {
			const recaptchaResult = await verifyRecaptcha(
				recaptchaToken.toString(),
				RECAPTCHA_ACTIONS.CREATE_MEMORIAL,
				getScoreThreshold(RECAPTCHA_ACTIONS.CREATE_MEMORIAL)
			);

			if (!recaptchaResult.success) {
				console.error('[PROFILE_SERVER] reCAPTCHA verification failed:', recaptchaResult.error);
				return fail(400, {
					message: 'Security verification failed. Please try again.'
				});
			}

			console.log(`[PROFILE_SERVER] reCAPTCHA verified successfully. Score: ${recaptchaResult.score}`);
		} else {
			console.warn('[PROFILE_SERVER] No reCAPTCHA token provided');
			return fail(400, {
				message: 'Security verification required. Please refresh and try again.'
			});
		}

		// Check if user has already created a memorial and hasn't paid
		const userDoc = await adminDb.collection('users').doc(locals.user.uid).get();
		const userData = userDoc.data();

		if (userData?.memorialCount > 0 && !userData?.hasPaidForMemorial) {
			return fail(400, {
				message: 'You must complete payment for your existing memorial before creating a new one.'
			});
		}

		const lovedOneName = data.get('lovedOneName')?.toString().trim();
		
		console.log('🎯 [PROFILE_SERVER] Form data received:', { lovedOneName });

		if (!lovedOneName) {
			console.error('❌ [PROFILE_SERVER] Missing loved one name');
			return fail(400, { message: "Loved one's name is required" });
		}

		try {
			// Generate base fullSlug from loved one's name
			const baseSlug = `celebration-of-life-for-${lovedOneName
				.toLowerCase()
				.replace(/[^a-z0-9\s-]/g, '')
				.replace(/\s+/g, '-')
				.replace(/-+/g, '-')
				.replace(/^-|-$/g, '')}`.substring(0, 80);

			// Check for existing fullSlugs and make unique
			let fullSlug = baseSlug;
			let counter = 1;
			let isUnique = false;

			while (!isUnique) {
				const existingMemorial = await adminDb
					.collection('memorials')
					.where('fullSlug', '==', fullSlug)
					.limit(1)
					.get();

				if (existingMemorial.empty) {
					isUnique = true;
				} else {
					fullSlug = `${baseSlug}-${counter}`;
					counter++;
				}
			}

			console.log(`[PROFILE] Creating memorial with unique fullSlug: ${fullSlug}`);

			// Create the memorial
			const memorialData = {
				lovedOneName,
				fullSlug,
				ownerUid: locals.user.uid,
				ownerEmail: locals.user.email,
				
				// Memorial metadata
				title: `Celebration of Life for ${lovedOneName}`,
				description: `A celebration of life dedicated to ${lovedOneName}`,

				// Basic memorial structure
				services: {
					main: {
						location: { name: '', address: '', isUnknown: true },
						time: { date: null, time: null, isUnknown: true },
						hours: 2
					},
					additional: []
				},

				// Memorial settings
				isPublic: true, // Make public so it's accessible
				content: `<h1>Celebration of Life for ${lovedOneName}</h1><p>This page is dedicated to celebrating the life and legacy of ${lovedOneName}.</p>`,
				custom_html: null,
				isPaid: false, // Track payment status
				
				// Additional fields for memorial page
				photos: [],
				embeds: [],
				birthDate: null,
				deathDate: null,
				imageUrl: null,

				createdAt: new Date(),
				updatedAt: new Date()
			};

			const memorialRef = await adminDb.collection('memorials').add(memorialData);

			// Update user's memorial count
			await adminDb
				.collection('users')
				.doc(locals.user.uid)
				.set(
					{
						memorialCount: (userData?.memorialCount || 0) + 1,
						updatedAt: new Date().toISOString()
					},
					{ merge: true }
				);

			console.log(`[PROFILE] Memorial created successfully with ID: ${memorialRef.id}`);

			return {
				success: true,
				memorialId: memorialRef.id,
				memorialSlug: fullSlug,
				memorialUrl: `/${fullSlug}`,
				message: `Celebration of Life for ${lovedOneName} created successfully! You can view it at /${fullSlug}`
			};
		} catch (error) {
			console.error('Error creating memorial:', error);
			return fail(500, { message: 'Failed to create memorial. Please try again.' });
		}
	}
};
