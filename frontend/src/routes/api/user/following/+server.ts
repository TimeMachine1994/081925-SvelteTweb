import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';

/**
 * GET /api/user/following
 * Fetch list of memorials that the current user is following
 */
export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const { uid } = locals.user;

	try {
		// Get pagination parameters
		const limit = parseInt(url.searchParams.get('limit') || '20');
		const offset = parseInt(url.searchParams.get('offset') || '0');

		// Fetch user's following subcollection
		const followingQuery = adminDb
			.collection('users')
			.doc(uid)
			.collection('following')
			.orderBy('followedAt', 'desc')
			.limit(limit)
			.offset(offset);

		const followingSnap = await followingQuery.get();

		// Get full memorial data for each followed memorial
		const followedMemorials = await Promise.all(
			followingSnap.docs.map(async (doc) => {
				const followData = doc.data();
				const memorialDoc = await adminDb
					.collection('memorials')
					.doc(followData.memorialId)
					.get();

				if (!memorialDoc.exists) {
					// Memorial was deleted, return null
					return null;
				}

				const memorialData = memorialDoc.data();

				return {
					id: memorialDoc.id,
					lovedOneName: memorialData?.lovedOneName,
					fullSlug: memorialData?.fullSlug || memorialData?.slug,
					birthDate: memorialData?.birthDate,
					deathDate: memorialData?.deathDate,
					imageUrl: memorialData?.imageUrl,
					followerCount: memorialData?.followerCount || 0,
					isPublic: memorialData?.isPublic,
					followedAt: followData.followedAt,
					createdAt: memorialData?.createdAt
				};
			})
		);

		// Filter out null entries (deleted memorials)
		const validMemorials = followedMemorials.filter((m) => m !== null);

		return json({
			success: true,
			following: validMemorials,
			total: followingSnap.size,
			hasMore: followingSnap.size === limit
		});
	} catch (err) {
		console.error('Error fetching user following:', err);
		throw error(500, 'Failed to fetch following list');
	}
};
