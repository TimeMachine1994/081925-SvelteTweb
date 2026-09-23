/**
 * Mux Webhook Handler
 * 
 * Created: January 22, 2026
 * Handles all webhook events from Mux platform
 * 
 * Events handled:
 * - video.live_stream.active - Stream started broadcasting
 * - video.live_stream.idle - Stream stopped
 * - video.live_stream.disconnected - Stream disconnected
 * - video.asset.ready - Recording processed and ready (HLS playback ready;
 *   the downloadable MP4 is NOT necessarily ready yet — see below)
 * - video.asset.errored - Recording processing failed
 * - video.asset.static_renditions.preparing/.ready/.errored - MP4 download
 *   (`mp4_support`) lifecycle, which completes asynchronously *after*
 *   video.asset.ready. See $lib/server/mux.ts `getMuxAssetMp4Status` for the
 *   equivalent on-demand check.
 */

import { adminDb } from '$lib/server/firebase';
import { error as svelteKitError, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyMuxWebhookSignature } from '$lib/server/mux';
import { env } from '$env/dynamic/private';
import { findByMuxAssetId, findByMuxUploadId } from '$lib/server/db/repos/streams';
import { mergeRecording } from '$lib/utils/recording-selection';

console.log('🔔 [MUX WEBHOOK] Webhook handler loaded and ready');

/**
 * POST - Handle Mux webhook events
 */
export const POST: RequestHandler = async ({ request }) => {
	console.log('🔔 [MUX WEBHOOK] ========================================');
	console.log('🔔 [MUX WEBHOOK] Incoming webhook request');
	console.log('🔔 [MUX WEBHOOK] Timestamp:', new Date().toISOString());

	try {
		// Get raw body and full headers for v12+ signature verification
		const body = await request.text();
		const headers = request.headers;

		console.log('🔔 [MUX WEBHOOK] Body length:', body.length);
		console.log('🔔 [MUX WEBHOOK] Has mux-signature header:', headers.has('mux-signature'));

		// Verify webhook signature (v12+ API uses full headers object)
		console.log('🔐 [MUX WEBHOOK] Verifying webhook signature...');
		
		if (!env.MUX_WEBHOOK_SECRET) {
			console.error('❌ [MUX WEBHOOK] MUX_WEBHOOK_SECRET not configured');
			throw svelteKitError(500, 'Webhook secret not configured');
		}
		
		const isValid = verifyMuxWebhookSignature(body, headers, env.MUX_WEBHOOK_SECRET);

		if (!isValid) {
			console.error('❌ [MUX WEBHOOK] Invalid webhook signature');
			console.error('❌ [MUX WEBHOOK] This may be a malicious request or secret mismatch');
			throw svelteKitError(401, 'Invalid webhook signature');
		}

		console.log('✅ [MUX WEBHOOK] Signature verified successfully');

		// Parse webhook event
		const event = JSON.parse(body);
		
		console.log('🔔 [MUX WEBHOOK] Event type:', event.type);
		console.log('🔔 [MUX WEBHOOK] Event ID:', event.id);
		console.log('🔔 [MUX WEBHOOK] Event created:', event.created_at);
		console.log('🔔 [MUX WEBHOOK] Event data:', JSON.stringify(event.data, null, 2));

		// Route to appropriate handler based on event type
		switch (event.type) {
			case 'video.live_stream.active':
				await handleStreamActive(event);
				break;

			case 'video.live_stream.idle':
			case 'video.live_stream.disconnected':
				await handleStreamEnded(event);
				break;

			case 'video.asset.ready':
				await handleRecordingReady(event);
				break;

			case 'video.asset.errored':
				await handleRecordingError(event);
				break;

			case 'video.asset.static_renditions.preparing':
				await handleMp4RenditionUpdate(event, 'preparing');
				break;

			case 'video.asset.static_renditions.ready':
				await handleMp4RenditionUpdate(event, 'ready');
				break;

			case 'video.asset.static_renditions.errored':
				await handleMp4RenditionUpdate(event, 'errored');
				break;

			case 'video.upload.asset_created':
				await handleUploadAssetCreated(event);
				break;

			case 'video.upload.errored':
			case 'video.upload.cancelled':
				await handleUploadFailed(event);
				break;

			default:
				console.log('⚠️ [MUX WEBHOOK] Unhandled event type:', event.type);
				console.log('⚠️ [MUX WEBHOOK] Event will be acknowledged but not processed');
		}

		console.log('✅ [MUX WEBHOOK] Webhook processed successfully');
		console.log('🔔 [MUX WEBHOOK] ========================================');

		return json({ success: true, received: true });

	} catch (error: any) {
		console.error('❌ [MUX WEBHOOK] Error processing webhook:', error);
		console.error('❌ [MUX WEBHOOK] Error details:', {
			message: error?.message,
			stack: error?.stack
		});
		console.log('🔔 [MUX WEBHOOK] ========================================');

		if (error && typeof error === 'object' && 'status' in error) {
			throw error;
		}

		throw svelteKitError(500, 'Webhook processing failed');
	}
};

/**
 * Handle stream going live
 */
async function handleStreamActive(event: any) {
	console.log('🔴 [MUX WEBHOOK] Processing STREAM ACTIVE event');
	
	const liveStreamId = event.data.id;
	console.log('🔴 [MUX WEBHOOK] Live stream ID:', liveStreamId);

	try {
		// Find stream by Mux live stream ID (exclude deleted streams)
		console.log('🔍 [MUX WEBHOOK] Searching for stream in Firestore...');
		const streamSnapshot = await adminDb
			.collection('streams')
			.where('mux.liveStreamId', '==', liveStreamId)
			.get();

		// Filter out deleted streams in JS (isDeleted field may not exist on all docs)
		const validStreams = streamSnapshot.docs.filter(doc => doc.data().isDeleted !== true);

		if (validStreams.length === 0) {
			console.warn('⚠️ [MUX WEBHOOK] No active stream found for live stream ID:', liveStreamId);
			console.warn('⚠️ [MUX WEBHOOK] This may be a test stream, deleted stream, or orphaned webhook');
			return;
		}

		const streamDoc = validStreams[0];
		console.log('✅ [MUX WEBHOOK] Stream found:', streamDoc.id);
		console.log('🔴 [MUX WEBHOOK] Current status:', streamDoc.data().status);

		// Update stream to live status
		console.log('💾 [MUX WEBHOOK] Updating stream to LIVE status...');
		await streamDoc.ref.update({
			status: 'live',
			'mux.streamingStatus': 'active',
			// NOTE: chat.locked is NOT auto-changed - admin controls chat lock status
			liveStartedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		});

		console.log('✅ [MUX WEBHOOK] Stream updated to LIVE');
		console.log('🔴 [MUX WEBHOOK] Stream:', streamDoc.id, 'is now broadcasting');

	} catch (error) {
		console.error('❌ [MUX WEBHOOK] Error handling stream active:', error);
		throw error;
	}
}

/**
 * Handle stream ending or disconnecting
 */
async function handleStreamEnded(event: any) {
	console.log('⏹️ [MUX WEBHOOK] Processing STREAM ENDED event');
	console.log('⏹️ [MUX WEBHOOK] Event type:', event.type);
	
	const liveStreamId = event.data.id;
	console.log('⏹️ [MUX WEBHOOK] Live stream ID:', liveStreamId);

	try {
		// Find stream by Mux live stream ID (exclude deleted streams)
		console.log('🔍 [MUX WEBHOOK] Searching for stream in Firestore...');
		const streamSnapshot = await adminDb
			.collection('streams')
			.where('mux.liveStreamId', '==', liveStreamId)
			.get();

		// Filter out deleted streams in JS
		const validStreams = streamSnapshot.docs.filter(doc => doc.data().isDeleted !== true);

		if (validStreams.length === 0) {
			console.warn('⚠️ [MUX WEBHOOK] No active stream found for live stream ID:', liveStreamId);
			return;
		}

		const streamDoc = validStreams[0];
		console.log('✅ [MUX WEBHOOK] Stream found:', streamDoc.id);

		// Update stream status
		const streamingStatus = event.type === 'video.live_stream.disconnected' ? 'disconnected' : 'idle';

		// Read current status — guard against overwriting 'completed' with 'ended'
		const currentData = streamDoc.data();
		const currentStatus = currentData.status;
		const newStatus = currentStatus === 'completed' ? 'completed' : 'ended';
		
		console.log('💾 [MUX WEBHOOK] Updating stream status...');
		console.log('⏹️ [MUX WEBHOOK] Status transition:', currentStatus, '→', newStatus);
		await streamDoc.ref.update({
			status: newStatus,
			'mux.streamingStatus': streamingStatus,
			liveEndedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		});

		console.log('✅ [MUX WEBHOOK] Stream updated');
		console.log('⏹️ [MUX WEBHOOK] Stream:', streamDoc.id, 'has ended');

	} catch (error) {
		console.error('❌ [MUX WEBHOOK] Error handling stream ended:', error);
		throw error;
	}
}

/**
 * Handle recording ready
 */
async function handleRecordingReady(event: any) {
	console.log('📼 [MUX WEBHOOK] Processing RECORDING READY event');
	
	const assetId = event.data.id;
	const liveStreamId = event.data.live_stream_id;
	const passthrough = event.data.passthrough;
	
	console.log('📼 [MUX WEBHOOK] Asset ID:', assetId);
	console.log('📼 [MUX WEBHOOK] Original live stream ID:', liveStreamId);
	console.log('📼 [MUX WEBHOOK] Passthrough (upload/premiere streams):', passthrough);

	try {
		// Find the stream document. Three cases, in priority order:
		// 1. RTMP/live streams — resolve via `live_stream_id` (existing behavior).
		// 2. Upload/premiere streams — `passthrough` IS our stream ID directly
		//    (set at upload creation time in createMuxDirectUpload()).
		// 3. Fallback — an asset we've already linked via `mux.assetId` (e.g. a
		//    retried/duplicate webhook, or a passthrough that got lost).
		console.log('🔍 [MUX WEBHOOK] Searching for stream in Firestore...');
		let streamDoc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot | null = null;
		let isUploadStream = false;

		if (liveStreamId) {
			const streamSnapshot = await adminDb
				.collection('streams')
				.where('mux.liveStreamId', '==', liveStreamId)
				.get();
			const validStreams = streamSnapshot.docs.filter((doc) => doc.data().isDeleted !== true);
			streamDoc = validStreams[0] ?? null;
		} else if (passthrough) {
			isUploadStream = true;
			const doc = await adminDb.collection('streams').doc(passthrough).get();
			if (doc.exists && doc.data()?.isDeleted !== true) {
				streamDoc = doc;
			}
		}

		if (!streamDoc) {
			const record = await findByMuxAssetId(assetId);
			if (record) {
				isUploadStream = record.sourceType === 'upload';
				streamDoc = await adminDb.collection('streams').doc(record.id).get();
			}
		}

		if (!streamDoc) {
			console.warn('⚠️ [MUX WEBHOOK] No stream found for asset (live_stream_id, passthrough, and assetId lookups all failed):', assetId);
			return;
		}

		console.log('✅ [MUX WEBHOOK] Stream found:', streamDoc.id, '| upload/premiere stream:', isUploadStream);

		// Extract playback ID and duration
		const playbackId = event.data.playback_ids?.[0]?.id;
		const duration = event.data.duration;

		console.log('📼 [MUX WEBHOOK] VOD Playback ID:', playbackId);
		console.log('📼 [MUX WEBHOOK] Duration:', duration, 'seconds');

		// New recording entry (candidate — only actually appended if this
		// assetId isn't already present, see mergeRecording below).
		const recording = {
			assetId,
			vodPlaybackId: playbackId,
			duration: duration || 0,
			createdAt: new Date().toISOString(),
			// mp4_support was requested at asset creation (see $lib/server/mux.ts),
			// so the MP4 is always still generating when the HLS asset first
			// becomes ready — video.asset.static_renditions.ready arrives later.
			mp4Status: 'preparing' as const
		};

		// Mux delivers webhooks at-least-once, so `video.asset.ready` can be
		// retried for the same asset. Run the read-merge-write in a
		// transaction so concurrent deliveries can't race each other, and
		// de-dupe on `assetId` (mergeRecording) instead of Firestore's
		// `arrayUnion`, which only de-dupes on exact object equality — since
		// each attempt stamps a fresh `createdAt`, a plain arrayUnion treated
		// every retry as a "new" recording and accumulated duplicates.
		const streamRef = streamDoc.ref;
		await adminDb.runTransaction(async (tx) => {
			const freshDoc = await tx.get(streamRef);
			if (!freshDoc.exists) {
				console.warn('⚠️ [MUX WEBHOOK] Stream disappeared before transaction could run:', streamRef.id);
				return;
			}

			const currentData = freshDoc.data()!;
			const isCurrentlyLive = currentData.status === 'live';

			console.log('📼 [MUX WEBHOOK] Current stream status:', currentData.status);
			console.log('📼 [MUX WEBHOOK] Is currently live:', isCurrentlyLive);

			const previousRecordings = currentData.mux?.recordings;
			const mergedRecordings = mergeRecording(previousRecordings, recording);
			// mergeRecording returns the same array reference on a no-op (retry
			// of an already-seen assetId) — only a genuinely new recording
			// should (re)initialize mp4Status, so a retried webhook doesn't
			// clobber a status that's already progressed past 'preparing'.
			const isNewRecording = mergedRecordings !== previousRecordings;

			const updateData: Record<string, any> = {
				// Legacy single-recording fields (latest recording wins)
				'mux.assetId': assetId,
				'mux.vodPlaybackId': playbackId,
				'mux.recordingReady': true,
				'mux.duration': duration,
				// De-duped recordings array (one entry per distinct asset)
				'mux.recordings': mergedRecordings,
				// NOTE: chat.locked is NOT auto-set - admin controls chat lock status
				recordingReady: true,  // Legacy field for backward compatibility
				updatedAt: new Date().toISOString()
			};

			if (isNewRecording) {
				updateData['mux.mp4Status'] = 'preparing';
			}

			if (isUploadStream) {
				// Upload/premiere streams: the asset being "ready" just means the
				// file has finished processing and is ready to premiere at its
				// scheduledStartTime. The public page derives live/recorded state
				// from scheduledStartTime + duration, not from `status` — so leave
				// `status` as 'scheduled'/'ready' rather than flipping to 'completed'.
				updateData['mux.uploadStatus'] = 'asset_created';
				console.log('📼 [MUX WEBHOOK] Upload/premiere asset ready — leaving status as-is:', currentData.status);
			} else if (!isCurrentlyLive) {
				// RACE GUARD: Only set status to 'completed' if NOT currently live
				// (a new session may have started while this recording was processing)
				updateData.status = 'completed';
				console.log('📼 [MUX WEBHOOK] Setting status to completed');
			} else {
				console.log('⚠️ [MUX WEBHOOK] Stream is currently LIVE — NOT overwriting status to completed');
			}

			console.log('💾 [MUX WEBHOOK] Updating stream with recording data...');
			tx.update(streamRef, updateData);
		});

		console.log('✅ [MUX WEBHOOK] Recording information saved (de-duped by assetId)');
		console.log('📼 [MUX WEBHOOK] Stream:', streamDoc.id, 'recording is ready for playback');

	} catch (error) {
		console.error('❌ [MUX WEBHOOK] Error handling recording ready:', error);
		throw error;
	}
}

/**
 * Handle an MP4 static rendition (`mp4_support`) lifecycle update. These
 * fire *after* `video.asset.ready` — the MP4 download isn't ready until
 * `video.asset.static_renditions.ready` arrives (or is confirmed via the
 * on-demand `getMuxAssetMp4Status` check for missed webhooks / recordings
 * created before this tracking existed).
 */
async function handleMp4RenditionUpdate(event: any, status: 'preparing' | 'ready' | 'errored') {
	console.log('📼 [MUX WEBHOOK] Processing MP4 RENDITION', status.toUpperCase(), 'event');

	const assetId = event.data.id;
	console.log('📼 [MUX WEBHOOK] Asset ID:', assetId);

	try {
		const record = await findByMuxAssetId(assetId);
		if (!record) {
			console.warn('⚠️ [MUX WEBHOOK] No stream found for asset (mp4 rendition update):', assetId);
			return;
		}

		const streamRef = adminDb.collection('streams').doc(record.id);
		await adminDb.runTransaction(async (tx) => {
			const freshDoc = await tx.get(streamRef);
			if (!freshDoc.exists) {
				console.warn('⚠️ [MUX WEBHOOK] Stream disappeared before transaction could run:', streamRef.id);
				return;
			}

			const currentData = freshDoc.data()!;
			const recordings: any[] = currentData.mux?.recordings ?? [];
			const updatedRecordings = recordings.map((r) =>
				r.assetId === assetId ? { ...r, mp4Status: status } : r
			);

			const updateData: Record<string, any> = {
				'mux.recordings': updatedRecordings,
				updatedAt: new Date().toISOString()
			};

			// Mirror onto the legacy top-level field when this asset is the
			// "current" one referenced there (matches the recordingReady pattern).
			if (currentData.mux?.assetId === assetId) {
				updateData['mux.mp4Status'] = status;
			}

			tx.update(streamRef, updateData);
		});

		console.log('✅ [MUX WEBHOOK] MP4 rendition status saved:', status, 'for stream:', record.id);
	} catch (error) {
		console.error('❌ [MUX WEBHOOK] Error handling MP4 rendition update:', error);
		throw error;
	}
}

/**
 * Handle a direct upload's asset being created (upload/premiere streams only).
 * Fired as soon as the file finishes uploading and Mux starts transcoding it —
 * `video.asset.ready` (handled above) fires later once transcoding completes.
 */
async function handleUploadAssetCreated(event: any) {
	console.log('📤 [MUX WEBHOOK] Processing UPLOAD ASSET CREATED event');

	const uploadId = event.data.id;
	const assetId = event.data.asset_id;

	console.log('📤 [MUX WEBHOOK] Upload ID:', uploadId, '| Asset ID:', assetId);

	try {
		const record = await findByMuxUploadId(uploadId);
		if (!record) {
			console.warn('⚠️ [MUX WEBHOOK] No stream found for upload ID:', uploadId);
			return;
		}

		await adminDb.collection('streams').doc(record.id).update({
			'mux.assetId': assetId,
			'mux.uploadStatus': 'asset_created',
			updatedAt: new Date().toISOString()
		});

		console.log('✅ [MUX WEBHOOK] Linked upload to asset for stream:', record.id);
	} catch (error) {
		console.error('❌ [MUX WEBHOOK] Error handling upload asset created:', error);
		throw error;
	}
}

/**
 * Handle a direct upload failing or being cancelled (upload/premiere streams only).
 */
async function handleUploadFailed(event: any) {
	console.log('❌ [MUX WEBHOOK] Processing UPLOAD FAILED/CANCELLED event:', event.type);

	const uploadId = event.data.id;
	const status = event.type === 'video.upload.cancelled' ? 'cancelled' : 'errored';

	try {
		const record = await findByMuxUploadId(uploadId);
		if (!record) {
			console.warn('⚠️ [MUX WEBHOOK] No stream found for upload ID:', uploadId);
			return;
		}

		await adminDb.collection('streams').doc(record.id).update({
			status: 'error',
			'mux.uploadStatus': status,
			updatedAt: new Date().toISOString()
		});

		console.error('❌ [MUX WEBHOOK] Upload failed for stream:', record.id, '| status:', status);
	} catch (error) {
		console.error('❌ [MUX WEBHOOK] Error handling upload failure:', error);
		throw error;
	}
}

/**
 * Handle recording error
 */
async function handleRecordingError(event: any) {
	console.log('❌ [MUX WEBHOOK] Processing RECORDING ERROR event');
	
	const assetId = event.data.id;
	const liveStreamId = event.data.live_stream_id;
	const passthrough = event.data.passthrough;
	const errorMessage = event.data.errors?.messages?.[0] || 'Unknown error';
	
	console.log('❌ [MUX WEBHOOK] Asset ID:', assetId);
	console.log('❌ [MUX WEBHOOK] Live stream ID:', liveStreamId);
	console.log('❌ [MUX WEBHOOK] Error:', errorMessage);

	try {
		// Same three-tier lookup as handleRecordingReady (RTMP live_stream_id ->
		// upload passthrough -> assetId fallback).
		console.log('🔍 [MUX WEBHOOK] Searching for stream in Firestore...');
		let streamDoc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot | null = null;

		if (liveStreamId) {
			const streamSnapshot = await adminDb
				.collection('streams')
				.where('mux.liveStreamId', '==', liveStreamId)
				.get();
			const validStreams = streamSnapshot.docs.filter((doc) => doc.data().isDeleted !== true);
			streamDoc = validStreams[0] ?? null;
		} else if (passthrough) {
			const doc = await adminDb.collection('streams').doc(passthrough).get();
			if (doc.exists && doc.data()?.isDeleted !== true) {
				streamDoc = doc;
			}
		}

		if (!streamDoc) {
			const record = await findByMuxAssetId(assetId);
			if (record) {
				streamDoc = await adminDb.collection('streams').doc(record.id).get();
			}
		}

		if (!streamDoc) {
			console.warn('⚠️ [MUX WEBHOOK] No stream found for asset:', assetId);
			return;
		}

		console.log('✅ [MUX WEBHOOK] Stream found:', streamDoc.id);

		// Update stream with error status
		console.log('💾 [MUX WEBHOOK] Updating stream with error status...');
		await streamDoc.ref.update({
			status: 'error',
			'mux.recordingReady': false,
			updatedAt: new Date().toISOString()
		});

		console.error('❌ [MUX WEBHOOK] Recording failed for stream:', streamDoc.id);
		console.error('❌ [MUX WEBHOOK] Error message:', errorMessage);

	} catch (error) {
		console.error('❌ [MUX WEBHOOK] Error handling recording error:', error);
		throw error;
	}
}
