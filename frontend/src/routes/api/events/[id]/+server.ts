import { json } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const memorialId = params.id;

		const memorialRef = adminDb.collection('memorials').doc(memorialId);
		const memorialDoc = await memorialRef.get();

		if (!memorialDoc.exists) {
			return json({ error: 'Event not found' }, { status: 404 });
		}

		const event = memorialDoc.data();

		// Return essential event data including fullSlug
		return json({
			id: memorialDoc.id,
			lovedOneName: event?.lovedOneName,
			fullSlug: event?.fullSlug,
			isPublic: event?.isPublic,
			createdAt: event?.createdAt?.toDate?.()?.toISOString() || event?.createdAt
		});
	} catch (error) {
		console.error('Error fetching event:', error);
		return json({ error: 'Failed to fetch event' }, { status: 500 });
	}
};
