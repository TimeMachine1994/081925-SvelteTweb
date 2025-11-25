import { adminAuth, adminDb, FieldValue } from '$lib/server/firebase';
import { error as SvelteKitError, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Stream } from '$lib/types/stream';

// DEPRECATED: This endpoint uses the old OBS streaming system
// New streams should use /api/live-streams/create instead
// Keeping this for backward compatibility with existing integrations
async function setupOBSStreaming(title: string) {
	throw new Error('OBS streaming via this endpoint is deprecated. Please use /api/live-streams/create for new WHIP streams.');
}

// GET - Fetch all streams for a event
export const GET: RequestHandler = async ({ locals, params }) => {
	console.log('🎬 [STREAMS API] GET - Fetching streams for event:', params.memorialId);

	const memorialId = params.memorialId;

	try {
		// Verify event exists
		const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();

		if (!memorialDoc.exists) {
			console.log('❌ [STREAMS API] Event not found:', memorialId);
			throw SvelteKitError(404, 'Event not found');
		}

		const event = memorialDoc.data()!;

		// For GET requests, allow public access to public memorials
		// For authenticated users, check permissions for private memorials
		if (locals.user) {
			const userId = locals.user.uid;
			const hasPermission =
				locals.user.role === 'admin' ||
				event.ownerUid === userId ||
				event.funeralDirectorUid === userId;

			if (!hasPermission && !event.isPublic) {
				console.log('❌ [STREAMS API] User lacks permission for private event:', userId);
				throw SvelteKitError(403, 'Permission denied');
			}
		} else {
			// Unauthenticated users can only access public memorials
			if (!event.isPublic) {
				console.log('❌ [STREAMS API] Unauthenticated access to private event');
				throw SvelteKitError(403, 'Authentication required for private event');
			}
		}

		// Fetch streams from the streams collection
		console.log('🔍 [STREAMS API] Querying streams collection for event:', memorialId);

		const streamsSnapshot = await adminDb
			.collection('streams')
			.where('memorialId', '==', memorialId)
			.get();

		const streams: Stream[] = [];
		streamsSnapshot.forEach((doc) => {
			streams.push({
				id: doc.id,
				...doc.data()
			} as Stream);
		});

		// Sort by createdAt descending (newest first)
		streams.sort((a, b) => {
			const aTime = new Date(a.createdAt || 0).getTime();
			const bTime = new Date(b.createdAt || 0).getTime();
			return bTime - aTime;
		});

		console.log('✅ [STREAMS API] Found', streams.length, 'streams');

		return json({
			success: true,
			streams,
			event: {
				id: memorialId,
				lovedOneName: event.lovedOneName,
				fullSlug: event.fullSlug
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
	console.log('🎬 [STREAMS API] POST - Creating stream for event:', params.memorialId);

	// Check authentication
	if (!locals.user) {
		console.log('❌ [STREAMS API] User not authenticated');
		throw SvelteKitError(401, 'Authentication required');
	}

	const userId = locals.user.uid;
	const memorialId = params.memorialId;

	try {
		// Parse request body
		const requestBody = await request.json();
		console.log('📥 [STREAMS API] Request body received:', JSON.stringify(requestBody, null, 2));
		
		const { 
			title, 
			description, 
			scheduledStartTime,
			calculatorServiceType, 
			calculatorServiceIndex,
			serviceHash,
			lastSyncedAt,
			syncStatus
		} = requestBody;

		if (!title || typeof title !== 'string' || title.trim().length === 0) {
			throw SvelteKitError(400, 'Stream title is required');
		}

		// Verify event exists and user has access
		const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();

		if (!memorialDoc.exists) {
			console.log('❌ [STREAMS API] Event not found:', memorialId);
			throw SvelteKitError(404, 'Event not found');
		}

		const event = memorialDoc.data()!;

		// Check permissions
		const hasPermission =
			locals.user.role === 'admin' ||
			event.ownerUid === userId ||
			event.funeralDirectorUid === userId;

		if (!hasPermission) {
			console.log('❌ [STREAMS API] User lacks permission:', userId);
			throw SvelteKitError(403, 'Permission denied');
		}

		// For scheduled streams, OBS streaming setup is deferred until the actual start time
		// Only immediate live streams need streaming credentials right away
		let streamKey = '';
		let rtmpUrl = '';
		let cloudflareInputId = '';

		if (scheduledStartTime) {
			// Scheduled stream - just create the record for countdown display
			console.log('📅 [STREAMS API] Scheduled stream - deferring streaming setup until start time');
			console.log('📅 [STREAMS API] Creating database record for: ' + new Date(scheduledStartTime).toLocaleString());
		} else {
			// Immediate live stream - would need OBS setup, but that's deprecated
			console.log('⚠️ [STREAMS API] Immediate live stream requested, but OBS streaming is deprecated');
			console.log('⚠️ [STREAMS API] Creating record - streaming credentials must be configured separately');
			// TODO: Integrate with new WHIP streaming system for live streams
		}

		// Create stream object (avoiding undefined values for Firestore)
		const streamData: any = {
			title: title.trim(),
			description: description?.trim() || '',
			memorialId,
			status: scheduledStartTime ? 'scheduled' : 'ready',
			isVisible: true,
			streamKey,
			rtmpUrl,
			cloudflareInputId,
			createdBy: userId,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			syncStatus: syncStatus || 'synced'
		};

		// Only add optional fields if they have values (avoid undefined)
		if (scheduledStartTime) {
			streamData.scheduledStartTime = scheduledStartTime;
		}
		if (calculatorServiceType) {
			streamData.calculatorServiceType = calculatorServiceType;
		}
		if (calculatorServiceIndex !== undefined && calculatorServiceIndex !== null) {
			streamData.calculatorServiceIndex = calculatorServiceIndex;
		}
		if (serviceHash) {
			streamData.serviceHash = serviceHash;
		}
		if (lastSyncedAt) {
			streamData.lastSyncedAt = lastSyncedAt;
		}

		// OBS streaming only - no additional method-specific fields needed

		console.log('💾 [STREAMS API] Stream data to save:', JSON.stringify(streamData, null, 2));

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
		console.error('❌ [STREAMS API] Error details:', {
			message: error?.message,
			stack: error?.stack,
			name: error?.name,
			code: error?.code
		});

		if (error && typeof error === 'object' && 'status' in error) {
			throw error;
		}

		throw SvelteKitError(500, `Failed to create stream: ${error?.message || 'Unknown error'}`);
	}
};
