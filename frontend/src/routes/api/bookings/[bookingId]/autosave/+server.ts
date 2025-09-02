import { getAdminDb } from '$lib/server/firebase';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Timestamp } from 'firebase-admin/firestore';

export const POST: RequestHandler = async ({ request, params, locals }) => {
	console.log('🔄 Autosave endpoint hit');
	const { user } = locals;
	const { bookingId } = params;

	if (!user?.uid) {
		console.error('🔥 No user ID found');
		throw error(401, 'Unauthorized');
	}
	const userId = user.uid;

	const db = getAdminDb();
	const memorialRef = db.collection('memorials').doc(bookingId);

	try {
		const memorialDoc = await memorialRef.get();

		if (!memorialDoc.exists) {
			console.error(`🔥 Memorial with ID ${bookingId} not found`);
			throw error(404, 'Memorial not found');
		}

		const memorial = memorialDoc.data();
		if (memorial?.userId !== userId) {
			console.error(`🔥 User ${userId} not authorized to edit memorial ${bookingId}`);
			throw error(403, 'Forbidden');
		}

		const data = await request.json();
		console.log('💾 Payload received:', data);

		// Update the livestreamConfig field in the memorial document
		await memorialRef.update({
			livestreamConfig: data,
			updatedAt: Timestamp.now()
		});

		console.log(`✅ Memorial ${bookingId} updated successfully`);
		return json({ success: true });
	} catch (e: any) {
		console.error('🔥 Error updating memorial:', e);
		throw error(500, 'Internal Server Error');
	}
};