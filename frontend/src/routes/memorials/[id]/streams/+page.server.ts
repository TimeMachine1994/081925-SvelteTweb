// Server Load for Stream Management Page
import type { PageServerLoad } from './$types';
import { adminDb } from '$lib/server/firebase';
import type { LiveStream } from '$lib/types/stream-v2';

export const load: PageServerLoad = async ({ params, locals, fetch }) => {
	const memorialId = params.id;

	// Fetch memorial details
	const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();

	if (!memorialDoc.exists) {
		return {
			memorial: null,
			streams: [],
			canManage: false
		};
	}

	const memorialData = memorialDoc.data()!;
	
	// Convert Firestore data to serializable format
	const memorial = {
		id: memorialDoc.id,
		lovedOneName: memorialData.lovedOneName,
		ownerUid: memorialData.ownerUid,
		funeralDirectorUid: memorialData.funeralDirectorUid,
		isPublic: memorialData.isPublic
	};

	// Check if user can manage streams
	let canManage = false;
	if (locals.user) {
		const userRole = locals.user.role;
		const userId = locals.user.uid;

		canManage =
			userRole === 'admin' ||
			userRole === 'funeral_director' ||
			memorialData.funeralDirectorUid === userId;
	}

	// Fetch streams using API
	const response = await fetch(`/api/live-streams/memorial/${memorialId}`);
	const data = await response.json();

	const streams: LiveStream[] = data.streams || [];

	return {
		memorial,
		streams,
		canManage
	};
};