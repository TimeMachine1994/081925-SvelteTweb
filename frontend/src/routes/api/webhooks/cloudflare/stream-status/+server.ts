import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb, FieldValue } from '$lib/firebase-admin';

/**
 * Cloudflare Stream Webhook Handler
 * Automatically detects when streams start/stop and updates Firebase
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const webhookData = await request.json();
		console.log('🔔 [CLOUDFLARE_WEBHOOK] Received stream status webhook:', webhookData);

		// Extract stream information from Cloudflare webhook
		const { 
			uid: cloudflareStreamId, 
			status, 
			eventType,
			liveInput 
		} = webhookData;

		if (!cloudflareStreamId) {
			console.warn('⚠️ [CLOUDFLARE_WEBHOOK] No stream ID in webhook data');
			return json({ error: 'Missing stream ID' }, { status: 400 });
		}

		console.log('📡 [CLOUDFLARE_WEBHOOK] Processing event:', {
			cloudflareStreamId,
			status,
			eventType,
			liveInputId: liveInput?.uid
		});

		// Find the stream in our unified streams collection
		const streamsQuery = await adminDb.collection('streams')
			.where('cloudflareId', '==', cloudflareStreamId)
			.get();

		if (streamsQuery.empty) {
			console.warn('⚠️ [CLOUDFLARE_WEBHOOK] Stream not found in database:', cloudflareStreamId);
			return json({ error: 'Stream not found' }, { status: 404 });
		}

		// Process each matching stream (should be only one)
		for (const streamDoc of streamsQuery.docs) {
			const streamData = streamDoc.data();
			const streamId = streamDoc.id;

			console.log('🎯 [CLOUDFLARE_WEBHOOK] Found stream:', {
				streamId,
				title: streamData.title,
				currentStatus: streamData.status,
				newStatus: status
			});

			// Handle different webhook events
			switch (eventType) {
				case 'stream.live':
					await handleStreamLive(streamId, streamData, webhookData);
					break;
				
				case 'stream.disconnected':
				case 'stream.ended':
					await handleStreamEnded(streamId, streamData, webhookData);
					break;
				
				case 'video.ready':
					await handleRecordingReady(streamId, streamData, webhookData);
					break;
				
				default:
					console.log('📝 [CLOUDFLARE_WEBHOOK] Unhandled event type:', eventType);
			}
		}

		return json({ success: true, processed: streamsQuery.size });

	} catch (error) {
		console.error('❌ [CLOUDFLARE_WEBHOOK] Error processing webhook:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

/**
 * Handle stream going live
 */
async function handleStreamLive(streamId: string, streamData: any, webhookData: any) {
	console.log('🔴 [CLOUDFLARE_WEBHOOK] Stream went live:', streamId);
	
	const updateData = {
		status: 'live',
		actualStartTime: FieldValue.serverTimestamp(),
		updatedAt: FieldValue.serverTimestamp(),
		cloudflareStatus: webhookData.status
	};

	await adminDb.collection('streams').doc(streamId).update(updateData);
	console.log('✅ [CLOUDFLARE_WEBHOOK] Updated stream to live status');
}

/**
 * Handle stream ending/disconnecting
 */
async function handleStreamEnded(streamId: string, streamData: any, webhookData: any) {
	console.log('⏹️ [CLOUDFLARE_WEBHOOK] Stream ended:', streamId);
	
	// Create a recording session entry
	const recordingSession = {
		sessionId: `${streamId}_${Date.now()}`,
		cloudflareStreamId: webhookData.uid,
		startTime: streamData.actualStartTime || FieldValue.serverTimestamp(),
		endTime: FieldValue.serverTimestamp(),
		duration: webhookData.duration || null,
		status: 'processing',
		recordingReady: false,
		recordingUrl: null,
		playbackUrl: null,
		createdAt: FieldValue.serverTimestamp()
	};

	// Update stream status and add recording session
	const updateData = {
		status: 'ready', // Ready for next session
		endTime: FieldValue.serverTimestamp(),
		updatedAt: FieldValue.serverTimestamp(),
		cloudflareStatus: webhookData.status,
		// Add to recording sessions array
		recordingSessions: FieldValue.arrayUnion(recordingSession)
	};

	await adminDb.collection('streams').doc(streamId).update(updateData);
	
	// Also update memorial archive if this stream is associated with a memorial
	if (streamData.memorialId) {
		await updateMemorialArchive(streamData.memorialId, streamId, streamData, recordingSession);
	}
	
	console.log('✅ [CLOUDFLARE_WEBHOOK] Stream ended, recording session created');
}

/**
 * Handle recording being ready
 */
async function handleRecordingReady(streamId: string, streamData: any, webhookData: any) {
	console.log('📹 [CLOUDFLARE_WEBHOOK] Recording ready:', streamId);
	
	// Find the most recent recording session and update it
	const streamDoc = await adminDb.collection('streams').doc(streamId).get();
	const currentData = streamDoc.data();
	
	if (currentData?.recordingSessions) {
		const sessions = currentData.recordingSessions;
		const latestSession = sessions[sessions.length - 1];
		
		if (latestSession && !latestSession.recordingReady) {
			// Update the latest session with recording info
			latestSession.recordingReady = true;
			latestSession.recordingUrl = webhookData.playbackUrl || webhookData.hlsUrl;
			latestSession.playbackUrl = webhookData.dashUrl || webhookData.playbackUrl;
			latestSession.status = 'ready';
			latestSession.duration = webhookData.duration;
			latestSession.updatedAt = FieldValue.serverTimestamp();
			
			await adminDb.collection('streams').doc(streamId).update({
				recordingSessions: sessions,
				updatedAt: FieldValue.serverTimestamp()
			});
			
			console.log('✅ [CLOUDFLARE_WEBHOOK] Recording session updated with playback URLs');
		}
	}
}

/**
 * Update memorial archive with new recording session
 */
async function updateMemorialArchive(memorialId: string, streamId: string, streamData: any, recordingSession: any) {
	try {
		const archiveEntry = {
			id: recordingSession.sessionId,
			title: `${streamData.title} - ${new Date().toLocaleDateString()}`,
			description: streamData.description || '',
			cloudflareId: recordingSession.cloudflareStreamId,
			streamId: streamId,
			sessionId: recordingSession.sessionId,
			recordingReady: recordingSession.recordingReady,
			recordingPlaybackUrl: recordingSession.recordingUrl,
			playbackUrl: recordingSession.playbackUrl,
			isVisible: true,
			createdAt: FieldValue.serverTimestamp(),
			startTime: recordingSession.startTime,
			endTime: recordingSession.endTime,
			duration: recordingSession.duration
		};

		await adminDb.collection('memorials').doc(memorialId).update({
			'livestreamArchive': FieldValue.arrayUnion(archiveEntry),
			updatedAt: FieldValue.serverTimestamp()
		});

		console.log('✅ [CLOUDFLARE_WEBHOOK] Memorial archive updated');
	} catch (error) {
		console.error('❌ [CLOUDFLARE_WEBHOOK] Error updating memorial archive:', error);
	}
}
