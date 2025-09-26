import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { env } from '$env/dynamic/private';

/**
 * Webhook endpoint for Cloudflare Stream recording notifications
 * This is called when a recording is ready for playback
 */
export const POST: RequestHandler = async ({ request }) => {
	console.log('🎬 Cloudflare recording webhook received');

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

		// Find the livestream session with this Cloudflare ID
		const livestreamsQuery = await adminDb
			.collection('livestreams')
			.where('cloudflareId', '==', uid)
			.limit(1)
			.get();

		if (livestreamsQuery.empty) {
			console.warn('⚠️ No livestream found for Cloudflare ID:', uid);
			return json({ success: true, message: 'Livestream not found' });
		}

		const livestreamDoc = livestreamsQuery.docs[0];
		const livestreamData = livestreamDoc.data();
		const memorialId = livestreamData.memorialId;

		console.log('📍 Found livestream session:', livestreamDoc.id, 'for memorial:', memorialId);

		// Update the livestream session with recording URLs
		await livestreamDoc.ref.update({
			recordingReady: true,
			recordingPlaybackUrl: playback?.hls || playback?.dash || null,
			recordingThumbnail: playback?.thumbnail || null,
			recordingDuration: recording?.duration || null,
			recordingSize: recording?.size || null,
			recordingUpdatedAt: new Date()
		});

		// Update the memorial's archive entry
		const memorialRef = adminDb.collection('memorials').doc(memorialId);
		const memorialDoc = await memorialRef.get();

		if (memorialDoc.exists) {
			const memorial = memorialDoc.data();
			const archive = memorial?.livestreamArchive || [];

			// Find and update the archive entry for this session
			const updatedArchive = archive.map((entry: any) => {
				if (entry.cloudflareId === uid) {
					return {
						...entry,
						recordingReady: true,
						recordingPlaybackUrl: playback?.hls || playback?.dash || null,
						recordingThumbnail: playback?.thumbnail || null,
						recordingDuration: recording?.duration || null,
						recordingSize: recording?.size || null,
						updatedAt: new Date()
					};
				}
				return entry;
			});

			await memorialRef.update({
				livestreamArchive: updatedArchive
			});

			console.log('✅ Updated archive entry for memorial:', memorialId);
		}

		console.log('✅ Recording webhook processed successfully');

		return json({
			success: true,
			message: 'Recording processed successfully'
		});

	} catch (error) {
		console.error('💥 Error processing recording webhook:', error);
		return json(
			{ error: 'Failed to process recording webhook', details: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 }
		);
	}
};
