import { error, fail, redirect } from '@sveltejs/kit';
import { getAdminDb } from '$lib/server/firebase';
import type { Memorial } from '$lib/types/memorial';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	console.log(`📚 Loading memorial data for ID: ${params.memorialId}`);
	const memorialDocRef = getAdminDb().collection('memorials').doc(params.memorialId);
	const memorialDoc = await memorialDocRef.get();

	if (!memorialDoc.exists) {
		console.error(`❌ Memorial with ID ${params.memorialId} not found.`);
		error(404, 'Memorial not found');
	}

	const memorialData = { id: memorialDoc.id, ...memorialDoc.data() } as Memorial;
	console.log('✅ Memorial data loaded successfully:', memorialData);

	// Pass the memorial data to the page component, ensuring Timestamps are converted
	return {
		memorial: {
			...memorialData,
			createdAt: memorialData.createdAt?.toDate().toISOString(),
			updatedAt: memorialData.updatedAt?.toDate().toISOString()
		}
	};
};

export const actions: Actions = {
	default: async ({ request, params }) => {
		const formData = await request.formData();
		const servicePackage = formData.get('servicePackage');
		const dateTime = formData.get('dateTime');
		const specialRequests = formData.get('specialRequests');
		const memorialId = params.memorialId;

		console.log('🎬 Received booking submission:', {
			servicePackage,
			dateTime,
			specialRequests,
			memorialId
		});

		if (!servicePackage || !dateTime) {
			console.error('❌ Missing required booking fields.');
			return fail(400, { missing: true });
		}

		try {
			const db = getAdminDb();
			const bookingRef = await db.collection('bookings').add({
				memorialId,
				servicePackage,
				dateTime,
				specialRequests,
				createdAt: new Date(),
				status: 'pending' // or some initial status
			});
			console.log(`✅ Successfully created booking with ID: ${bookingRef.id}`);
		} catch (err) {
			console.error('🔥 Error creating booking in Firestore:', err);
			return fail(500, { error: 'Could not create booking.' });
		}

		redirect(303, '/app/checkout/success');
	}
};