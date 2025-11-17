import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

// Follow a memorial
export const POST: RequestHandler = async ({ locals, params }) => {
	console.log('➕ Received request to follow memorial...');

	if (!locals.user) {
		console.error('🚫 Unauthorized: User not logged in.');
		throw error(401, 'Unauthorized');
	}

	const { memorialId } = params;
	const { uid } = locals.user;

	try {
		// Get memorial details for inverse index
		const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();
		
		if (!memorialDoc.exists) {
			throw error(404, 'Memorial not found');
		}

		const memorialData = memorialDoc.data();
		const timestamp = Timestamp.now();

		// Use batch write for atomic operation
		const batch = adminDb.batch();

		// 1. Add to memorial's followers subcollection
		const followerRef = adminDb
			.collection('memorials')
			.doc(memorialId)
			.collection('followers')
			.doc(uid);

		batch.set(followerRef, {
			userId: uid,
			followedAt: timestamp
		});

		// 2. Add to user's following subcollection (inverse index)
		const followingRef = adminDb
			.collection('users')
			.doc(uid)
			.collection('following')
			.doc(memorialId);

		batch.set(followingRef, {
			memorialId: memorialId,
			memorialName: memorialData?.lovedOneName || 'Unknown',
			memorialSlug: memorialData?.fullSlug || memorialData?.slug,
			followedAt: timestamp
		});

		// 3. Increment follower count on memorial
		const memorialRef = adminDb.collection('memorials').doc(memorialId);
		batch.update(memorialRef, {
			followerCount: FieldValue.increment(1)
		});

		await batch.commit();

		console.log(`✅ User ${uid} is now following memorial ${memorialId}.`);
		return json({ 
			success: true, 
			status: 'followed',
			followerCount: (memorialData?.followerCount || 0) + 1
		}, { status: 201 });
	} catch (err) {
		console.error('🔥 An unexpected error occurred:', err);
		throw error(500, 'An unexpected error occurred while following the memorial.');
	}
};

// Unfollow a memorial
export const DELETE: RequestHandler = async ({ locals, params }) => {
	console.log('➖ Received request to unfollow memorial...');

	if (!locals.user) {
		console.error('🚫 Unauthorized: User not logged in.');
		throw error(401, 'Unauthorized');
	}

	const { memorialId } = params;
	const { uid } = locals.user;

	try {
		// Get current memorial data for follower count
		const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();
		
		if (!memorialDoc.exists) {
			throw error(404, 'Memorial not found');
		}

		const memorialData = memorialDoc.data();

		// Use batch write for atomic operation
		const batch = adminDb.batch();

		// 1. Remove from memorial's followers subcollection
		const followerRef = adminDb
			.collection('memorials')
			.doc(memorialId)
			.collection('followers')
			.doc(uid);

		batch.delete(followerRef);

		// 2. Remove from user's following subcollection (inverse index)
		const followingRef = adminDb
			.collection('users')
			.doc(uid)
			.collection('following')
			.doc(memorialId);

		batch.delete(followingRef);

		// 3. Decrement follower count on memorial (prevent going below 0)
		const memorialRef = adminDb.collection('memorials').doc(memorialId);
		const currentCount = memorialData?.followerCount || 0;
		
		if (currentCount > 0) {
			batch.update(memorialRef, {
				followerCount: FieldValue.increment(-1)
			});
		}

		await batch.commit();

		console.log(`✅ User ${uid} has unfollowed memorial ${memorialId}.`);
		return json({ 
			success: true, 
			status: 'unfollowed',
			followerCount: Math.max(0, currentCount - 1)
		});
	} catch (err) {
		console.error('🔥 An unexpected error occurred:', err);
		throw error(500, 'An unexpected error occurred while unfollowing the memorial.');
	}
};
