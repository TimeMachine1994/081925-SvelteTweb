import { redirect, error } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';

export const load = async ({ locals, params }: any) => {
	// Auth check
	if (!locals.user || locals.user.role !== 'admin') {
		throw redirect(302, '/login');
	}

	const { userId } = params;

	try {
		// 1. Get main user profile
		const userDoc = await adminDb.collection('users').doc(userId).get();
		if (!userDoc.exists) {
			throw error(404, 'User not found');
		}
		const userData = userDoc.data();

		// 2. Get funeral director profile (if applicable)
		let funeralDirectorData = null;
		if (userData?.role === 'funeral_director') {
			const fdDoc = await adminDb.collection('funeral_directors').doc(userId).get();
			if (fdDoc.exists) {
				funeralDirectorData = fdDoc.data();
			}
		}

		// 3. Get user's memorials
		const memorialsSnapshot = await adminDb
			.collection('memorials')
			.where('ownerUid', '==', userId)
			.get();
		const memorials = memorialsSnapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data()
		}));

		// 4. Get user's streams (across all memorials)
		const streamsPromises = memorials.map((memorial) =>
			adminDb
				.collection('streams')
				.where('memorialId', '==', memorial.id)
				.where('createdBy', '==', userId)
				.get()
		);
		const streamsSnapshots = await Promise.all(streamsPromises);
		const streams = streamsSnapshots.flatMap((snapshot) =>
			snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
		);

		// 5. Get user's slideshows (across all memorials)
		const slideshowsPromises = memorials.map(async (memorial) => {
			const slideshowsSnapshot = await adminDb
				.collection('memorials')
				.doc(memorial.id)
				.collection('slideshows')
				.where('createdBy', '==', userId)
				.get();
			return slideshowsSnapshot.docs.map((doc) => ({
				id: doc.id,
				memorialId: memorial.id,
				memorialName: memorial.lovedOneName,
				...doc.data()
			}));
		});
		const slideshowsArrays = await Promise.all(slideshowsPromises);
		const slideshows = slideshowsArrays.flat();

		// 6. Get invitations sent by user
		const invitationsSnapshot = await adminDb
			.collection('invitations')
			.where('invitedByUid', '==', userId)
			.get();
		const invitations = invitationsSnapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data()
		}));

		// 7. Get schedule edit requests
		const requestsSnapshot = await adminDb
			.collection('schedule_edit_requests')
			.where('requestedBy', '==', userId)
			.get();
		const scheduleRequests = requestsSnapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data()
		}));

		// 8. Get admin actions (if admin user)
		let adminActions = [];
		if (userData?.role === 'admin') {
			const actionsSnapshot = await adminDb
				.collection('admin_actions')
				.where('adminId', '==', userId)
				.orderBy('timestamp', 'desc')
				.limit(50)
				.get();
			adminActions = actionsSnapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data()
			}));
		}

		// 9. Get chat messages count (across all memorials)
		const chatMessagesPromises = memorials.map(async (memorial) => {
			const messagesSnapshot = await adminDb
				.collection('memorials')
				.doc(memorial.id)
				.collection('chat')
				.where('userId', '==', userId)
				.get();
			return messagesSnapshot.size;
		});
		const chatMessageCounts = await Promise.all(chatMessagesPromises);
		const totalChatMessages = chatMessageCounts.reduce((sum, count) => sum + count, 0);

		// 10. Get follower count (memorials user follows)
		let followedMemorialsCount = 0;
		const allMemorialsSnapshot = await adminDb.collection('memorials').limit(100).get();
		const followerPromises = allMemorialsSnapshot.docs.map(async (memorialDoc) => {
			const followerDoc = await adminDb
				.collection('memorials')
				.doc(memorialDoc.id)
				.collection('followers')
				.doc(userId)
				.get();
			return followerDoc.exists ? 1 : 0;
		});
		const followerResults = await Promise.all(followerPromises);
		followedMemorialsCount = followerResults.reduce((sum, count) => sum + count, 0);

		return {
			user: {
				id: userId,
				...userData,
				createdAt: userData?.createdAt?.toDate?.()?.toISOString() || null,
				updatedAt: userData?.updatedAt?.toDate?.()?.toISOString() || null,
				lastLoginAt: userData?.lastLoginAt?.toDate?.()?.toISOString() || null
			},
			funeralDirector: funeralDirectorData,
			memorials,
			streams,
			slideshows,
			invitations,
			scheduleRequests,
			adminActions,
			stats: {
				memorialCount: memorials.length,
				streamCount: streams.length,
				slideshowCount: slideshows.length,
				chatMessageCount: totalChatMessages,
				invitationCount: invitations.length,
				scheduleRequestCount: scheduleRequests.length,
				followedMemorialsCount
			}
		};
	} catch (err) {
		console.error('Error loading user detail:', err);
		throw error(500, 'Failed to load user details');
	}
};
