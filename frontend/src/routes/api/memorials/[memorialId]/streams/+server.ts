import { adminAuth, adminDb, FieldValue } from '$lib/server/firebase';
import { error as SvelteKitError, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Stream } from '$lib/types/stream';
import { createLiveInput, isCloudflareConfigured } from '$lib/server/cloudflare-stream';
import { setupOBSMethod, setupPhoneToOBSMethod, setupPhoneToMUXMethod } from '$lib/server/streaming-methods';
import { isValidStreamingMethod } from '$lib/types/streaming-methods';

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
			streamingMethod = 'obs', // Default to OBS method
			calculatorServiceType, 
			calculatorServiceIndex,
			serviceHash,
			lastSyncedAt,
			syncStatus
		} = requestBody;

		if (!title || typeof title !== 'string' || title.trim().length === 0) {
			throw SvelteKitError(400, 'Stream title is required');
		}

		// Validate streaming method
		if (!isValidStreamingMethod(streamingMethod)) {
			throw SvelteKitError(400, `Invalid streaming method: ${streamingMethod}`);
		}

		console.log('🎬 [STREAMS API] Selected streaming method:', streamingMethod);

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

		// Setup streaming method
		console.log('🎬 [STREAMS API] Setting up streaming method:', streamingMethod);
		let methodConfig: any = {};
		let streamKey = '';
		let rtmpUrl = '';
		let cloudflareInputId = '';

		try {
			if (streamingMethod === 'obs') {
				// OBS Method: Single RTMP stream
				const config = await setupOBSMethod();
				streamKey = config.streamKey;
				rtmpUrl = config.rtmpUrl;
				cloudflareInputId = config.cloudflareInputId;
				methodConfig = { type: 'obs', cloudflareInputId };
			} else if (streamingMethod === 'phone-to-obs') {
				// Phone to OBS Method: Two streams (phone + OBS)
				const config = await setupPhoneToOBSMethod();
				streamKey = config.obsDestination.streamKey;
				rtmpUrl = config.obsDestination.rtmpUrl;
				cloudflareInputId = config.obsDestination.cloudflareInputId;
				methodConfig = {
					type: 'phone-to-obs',
					obsDestination: config.obsDestination,
					phoneSource: config.phoneSource
				};
			} else if (streamingMethod === 'phone-to-mux') {
				// Phone to MUX Method: Phone + restreaming
				const config = await setupPhoneToMUXMethod();
				// This will throw an error until Phase 5
				cloudflareInputId = config.cloudflare.inputId;
				methodConfig = {
					type: 'phone-to-mux',
					cloudflare: config.cloudflare,
					mux: config.mux
				};
			}

			console.log('✅ [STREAMS API] Streaming method configured successfully');
		} catch (error) {
			console.error('❌ [STREAMS API] Failed to setup streaming method:', error);
			throw SvelteKitError(500, `Failed to configure ${streamingMethod} streaming: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}

		// Create stream object with method configuration (avoiding undefined values for Firestore)
		const streamData: any = {
			title: title.trim(),
			description: description?.trim() || '',
			memorialId,
			status: scheduledStartTime ? 'scheduled' : 'ready',
			isVisible: true,
			streamKey,
			rtmpUrl,
			streamingMethod, // NEW: Store selected method
			methodConfigured: true, // NEW: Mark as configured
			createdBy: userId,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			syncStatus: syncStatus || 'synced'
		};

		// Only add optional fields if they have values (avoid undefined)
		if (cloudflareInputId) {
			streamData.cloudflareInputId = cloudflareInputId;
		}
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

		// Add method-specific fields
		if (streamingMethod === 'phone-to-obs') {
			streamData.phoneSourceStreamId = methodConfig.phoneSource.cloudflareInputId;
			streamData.phoneSourcePlaybackUrl = methodConfig.phoneSource.playbackUrl;
			streamData.phoneSourceWhipUrl = methodConfig.phoneSource.whipUrl;
		} else if (streamingMethod === 'phone-to-mux') {
			streamData.muxStreamId = methodConfig.mux.streamId;
			streamData.muxStreamKey = methodConfig.mux.streamKey;
			streamData.muxPlaybackId = methodConfig.mux.playbackId;
			streamData.restreamingEnabled = methodConfig.restreamingConfigured;
		}

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
