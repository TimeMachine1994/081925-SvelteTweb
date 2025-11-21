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
		try {
			if (userData?.role === 'funeral_director') {
				const fdDoc = await adminDb.collection('funeral_directors').doc(userId).get();
				if (fdDoc.exists) {
					funeralDirectorData = fdDoc.data();
				}
			}
		} catch (fdErr) {
			console.warn('Error fetching funeral director data:', fdErr);
		}

		// 3. Get user's memorials
		let memorials: any[] = [];
		try {
			const memorialsSnapshot = await adminDb
				.collection('memorials')
				.where('ownerUid', '==', userId)
				.get();
			memorials = memorialsSnapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data()
			}));
		} catch (memErr) {
			console.warn('Error fetching memorials:', memErr);
		}

		// 4. Get user's streams (across all memorials)
		let streams: any[] = [];
		try {
			if (memorials.length > 0) {
				const streamsPromises = memorials.map((memorial) =>
					adminDb
						.collection('streams')
						.where('memorialId', '==', memorial.id)
						.get()
						.catch(() => ({ docs: [] }))
				);
				const streamsSnapshots = await Promise.all(streamsPromises);
				streams = streamsSnapshots.flatMap((snapshot) =>
					snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
				);
			}
		} catch (streamErr) {
			console.warn('Error fetching streams:', streamErr);
		}

		// 5. Get user's slideshows (across all memorials)
		let slideshows: any[] = [];
		try {
			if (memorials.length > 0) {
				const slideshowsPromises = memorials.map(async (memorial) => {
					try {
						const slideshowsSnapshot = await adminDb
							.collection('memorials')
							.doc(memorial.id)
							.collection('slideshows')
							.get();
						return slideshowsSnapshot.docs.map((doc) => ({
							id: doc.id,
							memorialId: memorial.id,
							memorialName: memorial.lovedOneName,
							...doc.data()
						}));
					} catch {
						return [];
					}
				});
				const slideshowsArrays = await Promise.all(slideshowsPromises);
				slideshows = slideshowsArrays.flat();
			}
		} catch (slideErr) {
			console.warn('Error fetching slideshows:', slideErr);
		}

		// 6. Get invitations sent by user
		let invitations: any[] = [];
		try {
			const invitationsSnapshot = await adminDb
				.collection('invitations')
				.where('invitedByUid', '==', userId)
				.get();
			invitations = invitationsSnapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data()
			}));
		} catch (invErr) {
			console.warn('Error fetching invitations:', invErr);
		}

		// 7. Get schedule edit requests
		let scheduleRequests: any[] = [];
		try {
			const requestsSnapshot = await adminDb
				.collection('schedule_edit_requests')
				.where('requestedBy', '==', userId)
				.get();
			scheduleRequests = requestsSnapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data()
			}));
		} catch (reqErr) {
			console.warn('Error fetching schedule requests:', reqErr);
		}

		// 8. Get admin actions (if admin user)
		let adminActions: any[] = [];
		try {
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
		} catch (actionErr) {
			console.warn('Error fetching admin actions:', actionErr);
		}

		// 9. Get chat messages count (across all memorials)
		let totalChatMessages = 0;
		try {
			if (memorials.length > 0) {
				const chatMessagesPromises = memorials.map(async (memorial) => {
					try {
						const messagesSnapshot = await adminDb
							.collection('memorials')
							.doc(memorial.id)
							.collection('chat')
							.where('userId', '==', userId)
							.get();
						return messagesSnapshot.size;
					} catch {
						return 0;
					}
				});
				const chatMessageCounts = await Promise.all(chatMessagesPromises);
				totalChatMessages = chatMessageCounts.reduce((sum, count) => sum + count, 0);
			}
		} catch (chatErr) {
			console.warn('Error fetching chat messages:', chatErr);
		}

		// 10. Get follower count (memorials user follows) - simplified
		let followedMemorialsCount = 0;

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
