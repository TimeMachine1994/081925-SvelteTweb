import { adminDb } from '$lib/server/firebase';
import type { Memorial } from '$lib/types/memorial';
import type { ChatMessage } from '$lib/types/chat';

/**
 * User activity data structure
 */
export interface UserActivity {
	ownedMemorials: Memorial[];
	followedMemorials: Memorial[];
	recentComments: ChatMessage[];
	activityStats: {
		totalComments: number;
		memorialsFollowing: number;
		memorialsOwned: number;
	};
}

/**
 * Fetch comprehensive user activity data
 * @param userId - User's UID
 * @param role - User's role
 * @returns UserActivity object with all activity data
 */
export async function getUserActivity(
	userId: string,
	role: 'admin' | 'owner' | 'funeral_director' | 'viewer'
): Promise<UserActivity> {
	const [ownedMemorials, followedMemorials, recentComments] = await Promise.all([
		getOwnedMemorials(userId, role),
		getFollowedMemorials(userId),
		getUserComments(userId)
	]);

	return {
		ownedMemorials,
		followedMemorials,
		recentComments,
		activityStats: {
			totalComments: recentComments.length,
			memorialsFollowing: followedMemorials.length,
			memorialsOwned: ownedMemorials.length
		}
	};
}

/**
 * Get memorials owned or managed by user
 */
async function getOwnedMemorials(
	userId: string,
	role: 'admin' | 'owner' | 'funeral_director' | 'viewer'
): Promise<Memorial[]> {
	if (role === 'viewer') {
		return []; // Viewers don't own memorials
	}

	if (role === 'funeral_director') {
		// Query using funeralDirectorUid (compatible with both old and new memorials)
		const [snap1, snap2] = await Promise.all([
			adminDb.collection('memorials').where('funeralDirectorUid', '==', userId).get(),
			adminDb.collection('memorials').where('funeralDirector.id', '==', userId).get()
		]);

		// Combine and deduplicate
		const memorialMap = new Map();
		[...snap1.docs, ...snap2.docs].forEach((doc) => {
			if (!memorialMap.has(doc.id)) {
				const data = doc.data();
				if (!data.fullSlug && data.slug) {
					data.fullSlug = data.slug;
				}
				memorialMap.set(doc.id, { id: doc.id, ...data } as Memorial);
			}
		});

		return Array.from(memorialMap.values());
	} else if (role === 'owner') {
		const snap = await adminDb.collection('memorials').where('ownerUid', '==', userId).get();
		return snap.docs.map((doc) => {
			const data = doc.data();
			if (!data.fullSlug && data.slug) {
				data.fullSlug = data.slug;
			}
			return { id: doc.id, ...data } as Memorial;
		});
	}

	return [];
}

/**
 * Get memorials followed by user
 */
async function getFollowedMemorials(userId: string): Promise<Memorial[]> {
	const followingSnap = await adminDb
		.collection('users')
		.doc(userId)
		.collection('following')
		.orderBy('followedAt', 'desc')
		.limit(20)
		.get();

	const memorials = await Promise.all(
		followingSnap.docs.map(async (doc) => {
			const followData = doc.data();
			const memorialDoc = await adminDb.collection('memorials').doc(followData.memorialId).get();

			if (!memorialDoc.exists) {
				return null; // Memorial deleted
			}

			const data = memorialDoc.data();
			return {
				id: memorialDoc.id,
				...data,
				followedAt: followData.followedAt
			} as Memorial;
		})
	);

	return memorials.filter((m) => m !== null) as Memorial[];
}

/**
 * Get user's recent comments across all memorials
 */
async function getUserComments(userId: string, limit: number = 10): Promise<ChatMessage[]> {
	// Use collectionGroup to query across all memorial chat subcollections
	const commentsSnap = await adminDb
		.collectionGroup('chat')
		.where('userId', '==', userId)
		.where('isDeleted', '==', false)
		.orderBy('timestamp', 'desc')
		.limit(limit)
		.get();

	return commentsSnap.docs.map((doc) => ({
		id: doc.id,
		...doc.data()
	})) as ChatMessage[];
}

/**
 * Check if user is following a specific memorial
 */
export async function isUserFollowing(userId: string, memorialId: string): Promise<boolean> {
	const followDoc = await adminDb
		.collection('users')
		.doc(userId)
		.collection('following')
		.doc(memorialId)
		.get();

	return followDoc.exists;
}

/**
 * Get activity stats for user
 */
export async function getUserActivityStats(userId: string): Promise<{
	totalComments: number;
	memorialsFollowing: number;
	memorialsOwned: number;
}> {
	const [commentsSnap, followingSnap, ownedSnap] = await Promise.all([
		adminDb.collectionGroup('chat').where('userId', '==', userId).where('isDeleted', '==', false).get(),
		adminDb.collection('users').doc(userId).collection('following').get(),
		adminDb.collection('memorials').where('ownerUid', '==', userId).get()
	]);

	return {
		totalComments: commentsSnap.size,
		memorialsFollowing: followingSnap.size,
		memorialsOwned: ownedSnap.size
	};
}
