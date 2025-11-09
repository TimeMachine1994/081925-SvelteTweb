// API: Create Live Session
// POST /api/live-streams/create
// Creates a new live stream session with Cloudflare WHIP + Mux simulcast

import { adminDb } from '$lib/server/firebase';
import { error as SvelteKitError, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { CreateLiveSessionRequest, CreateLiveSessionResponse, LiveStream } from '$lib/types/stream-v2';
import { createLiveInput, createLiveOutput } from '$lib/server/cloudflare-stream';
import { createMuxLiveStream } from '$lib/server/mux-client';

export const POST: RequestHandler = async ({ locals, request }) => {
	console.log('🎬 [API] POST /api/live-streams/create');

	// Check authentication
	if (!locals.user) {
		console.log('❌ [API] User not authenticated');
		throw SvelteKitError(401, 'Authentication required');
	}

	const userId = locals.user.uid;
	const userRole = locals.user.role;

	// Check authorization - only admin and funeral_director can create
	if (userRole !== 'admin' && userRole !== 'funeral_director') {
		console.log('❌ [API] User lacks permission:', userRole);
		throw SvelteKitError(403, 'Only admins and funeral directors can create live sessions');
	}

	try {
		// Parse request body
		const requestBody: CreateLiveSessionRequest = await request.json();
		const { memorialId, title, description } = requestBody;

		console.log('📥 [API] Request:', { memorialId, title });

		// Validate required fields
		if (!memorialId || !title) {
			throw SvelteKitError(400, 'memorialId and title are required');
		}

		// Verify memorial exists and user has permission
		const memorialDoc = await adminDb.collection('memorials').doc(memorialId).get();

		if (!memorialDoc.exists) {
			console.log('❌ [API] Memorial not found:', memorialId);
			throw SvelteKitError(404, 'Memorial not found');
		}

		const memorial = memorialDoc.data()!;

		// Check memorial access permissions
		const hasPermission =
			userRole === 'admin' ||
			memorial.ownerUid === userId ||
			memorial.funeralDirectorUid === userId;

		if (!hasPermission) {
			console.log('❌ [API] User lacks permission for memorial:', userId);
			throw SvelteKitError(403, 'Permission denied for this memorial');
		}

		// Step 1: Create Mux Live Stream
		console.log('📡 [API] Creating Mux live stream...');
		const muxStream = await createMuxLiveStream(title);

		// Step 2: Create Cloudflare Live Input
		console.log('☁️ [API] Creating Cloudflare Live Input...');
		const cfLiveInput = await createLiveInput(title);

		// Step 3: Create Cloudflare Live Output → Mux (immediate simulcast)
		console.log('🔗 [API] Connecting Cloudflare → Mux simulcast...');
		const outputId = await createLiveOutput(
			cfLiveInput.liveInputId,
			muxStream.rtmpUrl,
			muxStream.streamKey
		);

		// Step 4: Create Firestore document
		const streamData: Omit<LiveStream, 'id'> = {
			memorialId,
			title: title.trim(),
			description: description?.trim() || '',
			status: 'ready',
			visibility: 'public',
			cloudflare: {
				liveInputId: cfLiveInput.liveInputId,
				whipUrl: cfLiveInput.whipUrl,
				whepUrl: cfLiveInput.whepUrl,
				outputId
			},
			mux: {
				liveStreamId: muxStream.liveStreamId,
				streamKey: muxStream.streamKey,
				playbackId: muxStream.playbackId
			},
			createdBy: userId,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		console.log('💾 [API] Saving to Firestore...');
		const streamRef = await adminDb.collection('live_streams').add(streamData);

		const createdStream: LiveStream = {
			id: streamRef.id,
			...streamData
		};

		console.log('✅ [API] Live session created:', streamRef.id);

		const response: CreateLiveSessionResponse = {
			success: true,
			stream: createdStream,
			whipUrl: cfLiveInput.whipUrl,
			message: 'Live session created successfully'
		};

		return json(response);
	} catch (error: any) {
		console.error('❌ [API] Error creating live session:', error);

		// Check if it's already a SvelteKit error
		if (error && typeof error === 'object' && 'status' in error) {
			throw error;
		}

		// Wrap other errors
		throw SvelteKitError(
			500,
			`Failed to create live session: ${error?.message || 'Unknown error'}`
		);
	}
};
