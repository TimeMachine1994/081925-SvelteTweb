import { adminAuth, adminDb, FieldValue } from '$lib/server/firebase';
import { error as SvelteKitError, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Stream } from '$lib/types/stream';

// GET - Fetch all streams for a memorial
export const GET: RequestHandler = async ({ locals, params }) => {
	console.log('🎬 [STREAMS API] GET - Fetching streams for memorial:', params.memorialId);

	// Check authentication
	if (!locals.user) {
		console.log('❌ [STREAMS API] User not authenticated');
		throw SvelteKitError(401, 'Authentication required');
	}

	const userId = locals.user.uid;
	const memorialId = params.memorialId;

	try {
		// Verify memorial exists and user has access
		const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();
		
		if (!memorialDoc.exists) {
			console.log('❌ [STREAMS API] Memorial not found:', memorialId);
			throw SvelteKitError(404, 'Memorial not found');
		}

		const memorial = memorialDoc.data()!;
		
		// Check permissions
		const hasPermission = 
			locals.user.role === 'admin' ||
			memorial.ownerUid === userId ||
			memorial.funeralDirectorUid === userId;

		if (!hasPermission) {
			console.log('❌ [STREAMS API] User lacks permission:', userId);
			throw SvelteKitError(403, 'Permission denied');
		}

		// Fetch streams from the streams collection
		console.log('🔍 [STREAMS API] Querying streams collection for memorial:', memorialId);
		
		const streamsSnapshot = await adminDb
			.collection('streams')
			.where('memorialId', '==', memorialId)
			.orderBy('createdAt', 'desc')
			.get();

		const streams: Stream[] = [];
		streamsSnapshot.forEach(doc => {
			streams.push({
				id: doc.id,
				...doc.data()
			} as Stream);
		});

		console.log('✅ [STREAMS API] Found', streams.length, 'streams');
		
		return json({
			success: true,
			streams,
			memorial: {
				id: memorialId,
				lovedOneName: memorial.lovedOneName,
				fullSlug: memorial.fullSlug
			}
		});

	} catch (error: any) {
		console.error('❌ [STREAMS API] Error fetching streams:', error);
		
		if (error && typeof error === 'object' && 'status' in error) {
			throw error;
		}
		
		throw SvelteKitError(500, 'Failed to fetch streams');
	}
};

// POST - Create a new stream
export const POST: RequestHandler = async ({ locals, params, request }) => {
	console.log('🎬 [STREAMS API] POST - Creating stream for memorial:', params.memorialId);

	// Check authentication
	if (!locals.user) {
		console.log('❌ [STREAMS API] User not authenticated');
		throw SvelteKitError(401, 'Authentication required');
	}

	const userId = locals.user.uid;
	const memorialId = params.memorialId;

	try {
		// Parse request body
		const { title, description, scheduledStartTime } = await request.json();
		
		if (!title || typeof title !== 'string' || title.trim().length === 0) {
			throw SvelteKitError(400, 'Stream title is required');
		}

		// Verify memorial exists and user has access
		const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();
		
		if (!memorialDoc.exists) {
			console.log('❌ [STREAMS API] Memorial not found:', memorialId);
			throw SvelteKitError(404, 'Memorial not found');
		}

		const memorial = memorialDoc.data()!;
		
		// Check permissions
		const hasPermission = 
			locals.user.role === 'admin' ||
			memorial.ownerUid === userId ||
			memorial.funeralDirectorUid === userId;

		if (!hasPermission) {
			console.log('❌ [STREAMS API] User lacks permission:', userId);
			throw SvelteKitError(403, 'Permission denied');
		}

		// Create stream object
		const streamData: Omit<Stream, 'id'> = {
			title: title.trim(),
			description: description?.trim() || '',
			memorialId,
			status: scheduledStartTime ? 'scheduled' : 'ready',
			isVisible: true,
			scheduledStartTime: scheduledStartTime || undefined,
			createdBy: userId,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		// Save to streams collection
		console.log('💾 [STREAMS API] Saving stream to Firestore...');
		const streamRef = await adminDb.collection('streams').add(streamData);
		
		const createdStream: Stream = {
			id: streamRef.id,
			...streamData
		};

		console.log('✅ [STREAMS API] Stream created and saved:', streamRef.id);
		
		return json({
			success: true,
			stream: createdStream,
			message: 'Stream created successfully'
		});

	} catch (error: any) {
		console.error('❌ [STREAMS API] Error creating stream:', error);
		
		if (error && typeof error === 'object' && 'status' in error) {
			throw error;
		}
		
		throw SvelteKitError(500, 'Failed to create stream');
	}
};
