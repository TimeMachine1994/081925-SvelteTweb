import { adminAuth, adminDb, FieldValue } from '$lib/server/firebase';
import { error as SvelteKitError, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Stream } from '$lib/types/stream';
import { setupOBSStreaming } from '$lib/server/streaming-methods';

// GET - Fetch all streams for a memorial
export const GET: RequestHandler = async ({ locals, params }) => {
	console.log('🎬 [STREAMS API] GET - Fetching streams for memorial:', params.memorialId);

	const memorialId = params.memorialId;

	try {
		// Verify memorial exists
		const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();

		if (!memorialDoc.exists) {
			console.log('❌ [STREAMS API] Memorial not found:', memorialId);
			throw SvelteKitError(404, 'Memorial not found');
		}

		const memorial = memorialDoc.data()!;

		// For GET requests, allow public access to public memorials
		// For authenticated users, check permissions for private memorials
		if (locals.user) {
			const userId = locals.user.uid;
			const hasPermission =
				locals.user.role === 'admin' ||
				memorial.ownerUid === userId ||
				memorial.funeralDirectorUid === userId;

			if (!hasPermission && !memorial.isPublic) {
				console.log('❌ [STREAMS API] User lacks permission for private memorial:', userId);
				throw SvelteKitError(403, 'Permission denied');
			}
		} else {
			// Unauthenticated users can only access public memorials
			if (!memorial.isPublic) {
				console.log('❌ [STREAMS API] Unauthenticated access to private memorial');
				throw SvelteKitError(403, 'Authentication required for private memorial');
			}
		}

		// Fetch streams from the streams collection
		console.log('🔍 [STREAMS API] Querying streams collection for memorial:', memorialId);

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

		// Setup OBS RTMP streaming
		console.log('🎬 [STREAMS API] Setting up OBS RTMP streaming');
		let streamKey = '';
		let rtmpUrl = '';
		let cloudflareInputId = '';

		try {
			const config = await setupOBSStreaming(title.trim());
			streamKey = config.streamKey;
			rtmpUrl = config.rtmpUrl;
			cloudflareInputId = config.cloudflareInputId;
			console.log('✅ [STREAMS API] OBS streaming configured successfully');
		} catch (error) {
			console.error('❌ [STREAMS API] Failed to setup OBS streaming:', error);
			throw SvelteKitError(500, `Failed to configure OBS streaming: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
