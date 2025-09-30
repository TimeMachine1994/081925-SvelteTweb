import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb, FieldValue } from '$lib/server/firebase';
import { env } from '$env/dynamic/private';

/**
 * Unified Cloudflare Stream recording webhook
 * 
 * This webhook now ONLY targets the unified 'streams' collection.
 * Legacy collections are no longer updated by this webhook.
 * 
 * @version 2.0 - Unified streams only
 */
export const POST: RequestHandler = async ({ request }) => {
	console.log('🎬 [UNIFIED] Cloudflare recording webhook received');

	try {
		// Verify webhook signature if secret is configured
		const webhookSecret = env.CLOUDFLARE_WEBHOOK_SECRET;
		if (webhookSecret) {
			const signature = request.headers.get('cf-webhook-signature');
			if (!signature) {
				console.error('❌ Missing webhook signature');
				return json({ error: 'Missing signature' }, { status: 401 });
			}
			// TODO: Implement signature verification
		}

		const payload = await request.json();
		console.log('📦 Webhook payload:', JSON.stringify(payload, null, 2));

		// Extract recording information
		const { uid, status, meta, playback, recording } = payload;
		
		if (status !== 'ready') {
			console.log('⏳ Recording not ready yet, status:', status);
			return json({ success: true, message: 'Recording not ready' });
		}

		if (!uid) {
			console.error('❌ Missing video UID in webhook payload');
			return json({ error: 'Missing video UID' }, { status: 400 });
		}

		console.log('🎥 Recording ready for video:', uid);
		console.log('🎥 Playback URLs:', playback);
		console.log('🎥 Recording info:', recording);

		// Find stream in the unified streams collection ONLY
		const streamsQuery = await adminDb
			.collection('streams')
			.where('cloudflareId', '==', uid)
			.limit(1)
			.get();

		if (streamsQuery.empty) {
			console.warn('⚠️ No stream found in unified collection for cloudflareId:', uid);
			return json({ 
				success: false, 
				message: 'Stream not found in unified collection',
				cloudflareId: uid 
			}, { status: 404 });
		}

		const streamDoc = streamsQuery.docs[0];
		const streamData = streamDoc.data();
		console.log('📍 Found unified stream:', streamDoc.id);

		// Create recording session entry
		const recordingSession = {
			sessionId: `session_${Date.now()}`,
			cloudflareStreamId: uid,
			startTime: streamData.actualStartTime || new Date(),
			endTime: new Date(),
			duration: recording?.duration || null,
			status: 'ready',
			recordingReady: true,
			recordingUrl: playback?.hls || playback?.dash || null,
			playbackUrl: `https://cloudflarestream.com/${uid}/iframe`,
			thumbnailUrl: playback?.thumbnail || null,
			createdAt: new Date(),
			updatedAt: new Date()
		};

		// Update the unified stream with standardized recording data
		await streamDoc.ref.update({
			// Legacy fields (for backward compatibility)
			recordingReady: true,
			recordingUrl: playback?.hls || playback?.dash || null,
			recordingDuration: recording?.duration || null,
			
			// New multi-session recording system
			recordingSessions: FieldValue.arrayUnion(recordingSession),
			
			// Stream status
			status: 'completed',
			playbackUrl: `https://cloudflarestream.com/${uid}/iframe`,
			updatedAt: new Date()
		});

		console.log('✅ Updated unified stream with recording data');
		
		// Update memorial archive if this stream is associated with a memorial
		if (streamData.memorialId) {
			await updateMemorialArchive(streamData.memorialId, uid, playback, recording, streamData);
		}

		return json({
			success: true,
			message: 'Unified stream recording processed successfully',
			streamId: streamDoc.id,
			cloudflareId: uid
		});

	} catch (error) {
		console.error('❌ Webhook processing error:', error);
		return json({ 
			error: 'Webhook processing failed',
			details: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 });
	}
};

/**
 * Helper function to update memorial archive for backward compatibility
 */
async function updateMemorialArchive(memorialId: string, cloudflareId: string, playback: any, recording: any, streamData: any) {
	try {
		const memorialRef = adminDb.collection('memorials').doc(memorialId);
		const memorialDoc = await memorialRef.get();

		if (!memorialDoc.exists) {
			console.warn('⚠️ Memorial not found:', memorialId);
			return;
		}

		const memorial = memorialDoc.data();
		const archive = memorial?.livestreamArchive || [];

		// Create or update archive entry
		const archiveEntry = {
			id: cloudflareId,
			title: streamData.title || 'Memorial Service',
			description: streamData.description || '',
			cloudflareId: cloudflareId,
			playbackUrl: playback?.hls || playback?.dash || `https://cloudflarestream.com/${cloudflareId}/iframe`,
			startedAt: streamData.actualStartTime || new Date(),
			endedAt: new Date(),
			duration: recording?.duration || null,
			isVisible: streamData.isVisible !== false,
			recordingReady: true,
			startedBy: streamData.createdBy || '',
			startedByName: streamData.createdByName || '',
			viewerCount: streamData.viewerCount || 0,
			createdAt: streamData.createdAt || new Date(),
			updatedAt: new Date()
		};

		// Check if entry already exists
		const existingIndex = archive.findIndex((entry: any) => entry.cloudflareId === cloudflareId);
		
		if (existingIndex >= 0) {
			// Update existing entry
			archive[existingIndex] = { ...archive[existingIndex], ...archiveEntry };
		} else {
			// Add new entry
			archive.push(archiveEntry);
		}

		await memorialRef.update({
			livestreamArchive: archive
		});

		console.log('✅ Updated memorial archive for:', memorialId);
	} catch (error) {
		console.error('❌ Error updating memorial archive:', error);
	}
}
