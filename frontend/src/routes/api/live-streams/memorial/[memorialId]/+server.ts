// API: Get Live Streams for Memorial
// GET /api/live-streams/memorial/:memorialId
// Returns all live streams for a specific memorial, filtered by user permissions

import { adminDb } from '$lib/server/firebase';
import { error as SvelteKitError, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { LiveStream, LiveStreamResponse } from '$lib/types/stream-v2';

export const GET: RequestHandler = async ({ locals, params }) => {
	const { memorialId } = params;
	console.log('🎬 [API] GET /api/live-streams/memorial/:memorialId:', memorialId);

	try {
		// Verify memorial exists
		const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();

		if (!memorialDoc.exists) {
			console.log('❌ [API] Memorial not found:', memorialId);
			throw SvelteKitError(404, 'Memorial not found');
		}

		const memorial = memorialDoc.data()!;

		// Determine user permissions
		let canViewHidden = false;
		if (locals.user) {
			const userId = locals.user.uid;
			const userRole = locals.user.role;

			canViewHidden =
				userRole === 'admin' ||
				memorial.ownerUid === userId ||
				memorial.funeralDirectorUid === userId;
		}

		// Fetch streams from live_streams collection
		console.log('🔍 [API] Querying live_streams collection...');
		const streamsSnapshot = await adminDb
			.collection('live_streams')
			.where('memorialId', '==', memorialId)
			.get();

		const streams: LiveStream[] = [];
		streamsSnapshot.forEach((doc) => {
			const data = doc.data();
			
			// Convert Firestore Timestamps to ISO strings for serialization
			const stream: LiveStream = {
				id: doc.id,
				memorialId: data.memorialId,
				title: data.title,
				description: data.description || '',
				status: data.status,
				visibility: data.visibility,
				cloudflare: data.cloudflare,
				mux: data.mux,
				createdBy: data.createdBy,
				createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : data.createdAt,
				updatedAt: data.updatedAt?.toDate?.() ? data.updatedAt.toDate().toISOString() : data.updatedAt,
				startedAt: data.startedAt?.toDate?.() ? data.startedAt.toDate().toISOString() : data.startedAt,
				endedAt: data.endedAt?.toDate?.() ? data.endedAt.toDate().toISOString() : data.endedAt
			};

			// Filter by visibility
			if (stream.visibility === 'public') {
				streams.push(stream);
			} else if (canViewHidden) {
				streams.push(stream);
			}
		});

		// Sort by createdAt descending (newest first)
		streams.sort((a, b) => {
			const aTime = new Date(a.createdAt || 0).getTime();
			const bTime = new Date(b.createdAt || 0).getTime();
			return bTime - aTime;
		});

		console.log('✅ [API] Found', streams.length, 'streams');

		const response: LiveStreamResponse = {
			success: true,
			streams
		};

		return json(response);
	} catch (error: any) {
		console.error('❌ [API] Error fetching streams:', error);

		if (error && typeof error === 'object' && 'status' in error) {
			throw error;
		}

		throw SvelteKitError(500, 'Failed to fetch streams');
	}
};
