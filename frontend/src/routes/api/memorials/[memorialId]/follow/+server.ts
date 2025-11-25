import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { Timestamp } from 'firebase-admin/firestore';

// Follow a event
export const POST: RequestHandler = async ({ locals, params }) => {
	console.log('➕ Received request to follow event...');

	if (!locals.user) {
		console.error('🚫 Unauthorized: User not logged in.');
		throw error(401, 'Unauthorized');
	}

	const { memorialId } = params;
	const { uid } = locals.user;

	try {
		const followerRef = adminDb
			.collection('memorials')
			.doc(memorialId)
			.collection('followers')
			.doc(uid);

		await followerRef.set({
			userId: uid,
			followedAt: Timestamp.now()
		});

		console.log(`✅ User ${uid} is now following event ${memorialId}.`);
		return json({ success: true, status: 'followed' }, { status: 201 });
	} catch (err) {
		console.error('🔥 An unexpected error occurred:', err);
		throw error(500, 'An unexpected error occurred while following the event.');
	}
};

// Unfollow a event
export const DELETE: RequestHandler = async ({ locals, params }) => {
	console.log('➖ Received request to unfollow event...');

	if (!locals.user) {
		console.error('🚫 Unauthorized: User not logged in.');
		throw error(401, 'Unauthorized');
	}

	const { memorialId } = params;
	const { uid } = locals.user;

	try {
		const followerRef = adminDb
			.collection('memorials')
			.doc(memorialId)
			.collection('followers')
			.doc(uid);

		await followerRef.delete();

		console.log(`✅ User ${uid} has unfollowed event ${memorialId}.`);
		return json({ success: true, status: 'unfollowed' });
	} catch (err) {
		console.error('🔥 An unexpected error occurred:', err);
		throw error(500, 'An unexpected error occurred while unfollowing the event.');
	}
};
