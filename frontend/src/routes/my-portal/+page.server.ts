import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { adminDb } from '$lib/server/firebase';
import type { LivestreamBooking } from '$lib/types/livestream';

export const load: PageServerLoad = async ({ locals }) => {
	console.log('🚪 [my-portal/+page.server.ts] Checking for user...');
	if (!locals.user) {
		console.log('🛑 [my-portal/+page.server.ts] No user found, redirecting to /login.');
		redirect(303, '/login');
	}

	const userId = locals.user.uid;
	console.log(`✅ [my-portal/+page.server.ts] User found: ${userId}. Fetching booking...`);

	try {
		const docRef = adminDb.collection('livestreams').doc(userId);
		const docSnap = await docRef.get();

		if (docSnap.exists) {
			console.log('✅ [my-portal/+page.server.ts] Found livestream booking document.');
			const data = docSnap.data();
			// Convert Firestore Timestamps to JS Date objects for serialization
			const bookingData = {
				...data,
				createdAt: data.createdAt.toDate(),
				savedAt: data.savedAt.toDate(),
				updatedAt: data.updatedAt.toDate()
			} as LivestreamBooking;
			return {
				livestreamBooking: bookingData
			};
		} else {
			console.log('ℹ️ [my-portal/+page.server.ts] No livestream booking document found for this user.');
			return {
				livestreamBooking: null
			};
		}
	} catch (error) {
		console.error('🔥 [my-portal/+page.server.ts] Error fetching livestream booking:', error);
		return fail(500, { message: 'Failed to fetch booking data.' });
	}
};

export const actions: Actions = {
	updateBooking: async ({ request, locals }) => {
		console.log('🚀 [my-portal/+page.server.ts] updateBooking action initiated.');
		if (!locals.user) {
			console.log('🛑 [my-portal/+page.server.ts] No user found for update action.');
			return fail(401, { message: 'You must be logged in to update a booking.' });
		}

		const userId = locals.user.uid;
		const formData = await request.formData();

		try {
			console.log('📝 [my-portal/+page.server.ts] Constructing updated booking object from form data...');
			const updatedBooking: Partial<LivestreamBooking> = {
				title: formData.get('title') as string,
				lovedOneName: formData.get('lovedOneName') as string,
				serviceDate: formData.get('serviceDate') as string,
				livestreamTime: formData.get('livestreamTime') as string,
				locationName: formData.get('locationName') as string,
				locationAddress: formData.get('locationAddress') as string,
				funeralHome: formData.get('funeralHome') as string,
				funeralDirector: formData.get('funeralDirector') as string,
				pocEmail: formData.get('pocEmail') as string,
				// Handle scheduleItems if it's sent as stringified JSON
				scheduleItems: formData.has('scheduleItems')
					? JSON.parse(formData.get('scheduleItems') as string)
					: [],
				// Handle boolean conversions
				addons: {
					photography: formData.get('addons.photography') === 'on',
					liveMusician: formData.get('addons.liveMusician') === 'on',
					audioVisual: formData.get('addons.audioVisual') === 'on'
				},
				// Handle number conversions
				hours: Number(formData.get('hours')),
				totalCalculatedAmount: Number(formData.get('totalCalculatedAmount')),
				updatedAt: new Date() // Using server-side timestamp
			};

			console.log('💾 [my-portal/+page.server.ts] Updating document in Firestore for user:', userId);
			const docRef = adminDb.collection('livestreams').doc(userId);
			await docRef.update(updatedBooking);

			console.log('✅ [my-portal/+page.server.ts] Booking updated successfully.');
			return {
				success: true,
				message: 'Booking updated successfully.'
			};
		} catch (error) {
			console.error('🔥 [my-portal/+page.server.ts] Error updating booking:', error);
			return fail(500, { message: 'An error occurred while updating the booking.' });
		}
	}
};