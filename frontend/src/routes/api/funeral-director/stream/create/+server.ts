import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { setupPhoneToMUXMethod } from '$lib/server/streaming-methods';
import { getMUXPlaybackUrl } from '$lib/server/mux';

export const POST: RequestHandler = async ({ request, locals }) => {
	console.log('🎥 [FD_STREAM] Create stream request received');

	if (!locals.user) {
		console.error('❌ [FD_STREAM] User not authenticated');
		throw error(401, 'Authentication required');
	}

	if (locals.user.role !== 'funeral_director') {
		console.error('❌ [FD_STREAM] User is not a funeral director');
		throw error(403, 'Funeral director access required');
	}

	try {
		const { memorialId, streamTitle, scheduledStartTime } = await request.json();

		if (!memorialId) {
			throw error(400, 'Memorial ID is required');
		}

		console.log('🔍 [FD_STREAM] Checking memorial access:', memorialId);

		const memorialRef = adminDb.collection('memorials').doc(memorialId);
		const memorialDoc = await memorialRef.get();

		if (!memorialDoc.exists) {
			throw error(404, 'Memorial not found');
		}

		const memorial = memorialDoc.data();

		if (memorial.funeralDirectorUid !== locals.user.uid && memorial.funeralDirector?.id !== locals.user.uid) {
			console.error('❌ [FD_STREAM] Funeral director not authorized for this memorial');
			throw error(403, 'Not authorized to stream to this memorial');
		}

		console.log('✅ [FD_STREAM] Authorization passed');

		const streamsRef = adminDb.collection('streams');
		const existingStreamQuery = await streamsRef
			.where('memorialId', '==', memorialId)
			.where('status', 'in', ['pending', 'live'])
			.limit(1)
			.get();

		if (!existingStreamQuery.empty) {
			const existingStream = existingStreamQuery.docs[0];
			console.warn('⚠️ [FD_STREAM] Active stream already exists:', existingStream.id);
			throw error(409, {
				message: 'An active stream already exists for this memorial',
				streamId: existingStream.id
			});
		}

		console.log('🎬 [FD_STREAM] Setting up Phone-to-MUX streaming method...');
		const methodConfig = await setupPhoneToMUXMethod();
		console.log('✅ [FD_STREAM] Streaming method configured');

		const playbackUrl = getMUXPlaybackUrl(methodConfig.mux.playbackId, 'hls');

		const streamData = {
			memorialId,
			streamingMethod: 'phone-to-mux',
			methodConfig,
			status: 'pending',
			funeralDirectorUid: locals.user.uid,
			createdBy: locals.user.uid,
			createdByRole: 'funeral_director',
			streamTitle: streamTitle || `${memorial.lovedOneName} - Funeral Service`,
			scheduledStartTime: scheduledStartTime ? new Date(scheduledStartTime) : null,
			createdAt: new Date(),
			playbackUrl,
			viewerCount: 0,
			peakViewerCount: 0
		};

		const streamRef = await streamsRef.add(streamData);
		console.log('✅ [FD_STREAM] Stream created:', streamRef.id);

		return json({
			success: true,
			streamId: streamRef.id,
			config: methodConfig,
			playbackUrl,
			memorial: {
				id: memorialId,
				lovedOneName: memorial.lovedOneName,
				fullSlug: memorial.fullSlug
			}
		});
	} catch (err: any) {
		console.error('❌ [FD_STREAM] Error creating stream:', err);
		if (err.status) {
			throw err;
		}
		throw error(500, `Failed to create stream: ${err.message}`);
	}
};
