import { adminAuth, adminDb, FieldValue } from '$lib/server/firebase';
import { error as SvelteKitError, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Stream } from '$lib/types/stream';
import { createLiveInput, isCloudflareConfigured } from '$lib/server/cloudflare-stream';

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

		// Create Cloudflare Live Input for real RTMP streaming
		console.log('🎬 [STREAMS API] Creating Cloudflare Live Input...');
		let cloudflareInput: any = null;
		let streamKey = '';
		let rtmpUrl = '';
		let cloudflareInputId = '';

		if (isCloudflareConfigured()) {
			try {
				cloudflareInput = await createLiveInput({
					name: `${memorial.lovedOneName} - ${title.trim()}`,
					recording: true,
					recordingTimeout: 30
				});

				// Extract real Cloudflare credentials
				streamKey = cloudflareInput.rtmps.streamKey;
				cloudflareInputId = cloudflareInput.uid;

				// DEBUG: Log all available URLs from Cloudflare
				console.log(
					'🔍 [STREAMS API DEBUG] Full Cloudflare input data:',
					JSON.stringify(cloudflareInput, null, 2)
				);
				console.log('🔍 [STREAMS API DEBUG] Available URLs:', {
					rtmps: cloudflareInput.rtmps?.url,
					rtmp: cloudflareInput.rtmp?.url,
					srt: cloudflareInput.srt?.url,
					webRTC: cloudflareInput.webRTC?.url
				});

				// Use RTMP (non-secure) if available, fallback to RTMPS
				rtmpUrl = cloudflareInput.rtmp?.url || cloudflareInput.rtmps?.url;

				console.log('✅ [STREAMS API] Cloudflare Live Input created:', cloudflareInputId);
				console.log('🔑 [STREAMS API] RTMP URL:', rtmpUrl);
				console.log('🔑 [STREAMS API] Stream Key:', streamKey.substring(0, 8) + '...');
				console.log(
					'🔍 [STREAMS API] URL Type:',
					rtmpUrl?.startsWith('rtmps://') ? 'RTMPS (Secure)' : 'RTMP (Standard)'
				);
			} catch (error) {
				console.error('❌ [STREAMS API] Failed to create Cloudflare Live Input:', error);
				// Fall back to placeholder values for development
				streamKey = `dev_${Math.random().toString(36).substring(2, 15)}`;
				rtmpUrl = 'rtmp://live.tributestream.com/live';
			}
		} else {
			console.warn('⚠️ [STREAMS API] Cloudflare not configured, using development placeholders');
			streamKey = `dev_${Math.random().toString(36).substring(2, 15)}`;
			rtmpUrl = 'rtmp://live.tributestream.com/live';
		}

		// Create stream object with real Cloudflare data
		const streamData: Omit<Stream, 'id'> = {
			title: title.trim(),
			description: description?.trim() || '',
			memorialId,
			status: scheduledStartTime ? 'scheduled' : 'ready',
			isVisible: true,
			streamKey,
			rtmpUrl,
			cloudflareInputId: cloudflareInputId || undefined,
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
