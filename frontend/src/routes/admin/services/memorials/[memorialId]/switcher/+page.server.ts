import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { adminDb } from '$lib/server/firebase';
import { createDailyRoom, createDailyToken } from '$lib/server/daily';
import { PRIVATE_DAILY_API_KEY } from '$env/static/private';

export const load: PageServerLoad = async ({ params, locals }) => {
	// 1. Security Check
	if (!locals.user || locals.user.role !== 'admin') {
		throw error(403, 'Unauthorized access');
	}

	const { memorialId } = params;

	// DEBUG: Allow test ID
	if (memorialId === 'test-memorial-id') {
		return {
			memorial: {
				id: 'test-memorial-id',
				name: 'Test Memorial Service',
				lovedOneName: 'John Doe'
			},
			dailyConfig: {
				roomUrl: 'https://demo.daily.co/test-room', // Mock URL
				token: 'mock-token'
			},
			DAILY_API_KEY: PRIVATE_DAILY_API_KEY ? 'present' : 'missing'
		};
	}

	// 2. Fetch Memorial
	const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();
	if (!memorialDoc.exists) {
		throw error(404, 'Memorial not found');
	}
	const memorial = memorialDoc.data();

	// 3. Fetch or Create Daily Room
	// Check if we already have a Daily room for this memorial
	// Storing in a subcollection 'system/daily' or just on the memorial doc
	// Let's use a stream record for this.
	
	const streamRef = adminDb.collection('memorials').doc(memorialId).collection('streams').doc('main-broadcast');
	let streamDoc = await streamRef.get();
	let dailyRoomName = streamDoc.exists ? streamDoc.data()?.dailyRoomName : null;
	let dailyRoomUrl = streamDoc.exists ? streamDoc.data()?.dailyRoomUrl : null;

	// If no room exists, create one
	if (!dailyRoomName) {
		// Create unique room name: "mem-{memorialId short hash}"
		const uniqueSuffix = memorialId.substring(0, 8);
		const roomName = `mem-${uniqueSuffix}-${Date.now().toString().slice(-4)}`; // Ensure uniqueness
		
		try {
			const room = await createDailyRoom({
				name: roomName,
				privacy: 'private',
				properties: {
					enable_recording: 'cloud',
					enable_hls: true,
					max_participants: 10,
					exp: Math.floor(Date.now() / 1000) + 86400 * 30 // 30 days expiry for the room
				}
			});
			
			dailyRoomName = room.name;
			dailyRoomUrl = room.url;

			// Save to Firestore
			await streamRef.set({
				id: 'main-broadcast',
				memorialId,
				dailyRoomName,
				dailyRoomUrl,
				createdAt: new Date(),
				type: 'daily-livestream'
			}, { merge: true });

		} catch (err) {
			console.error('Error creating Daily room:', err);
			// Fallback or error
		}
	}

	// 4. Generate Admin Token (Owner)
	let token = null;
	if (dailyRoomName) {
		const tokenData = await createDailyToken(dailyRoomName, {
			isOwner: true,
			userName: `Admin (${locals.user.displayName || 'Staff'})`,
			expiresIn: 86400 // 24 hours
		});
		token = tokenData.token;
	}

	return {
		memorial: {
			id: memorialId,
			name: memorial?.lovedOneName || 'Unknown Memorial',
			...memorial
		},
		dailyConfig: {
			roomUrl: dailyRoomUrl,
			token: token
		},
		DAILY_API_KEY: PRIVATE_DAILY_API_KEY ? 'present' : 'missing'
	};
};
