import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/server/firebase';
import { requireLivestreamAccess, createMemorialRequest } from '$lib/server/memorialMiddleware';
import { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN } from '$env/static/private';

/**
 * Check and update recording status for all archive entries
 * This can be called manually to sync recording status with Cloudflare
 */
export const POST: RequestHandler = async ({ params, locals }) => {
	console.log('🔄 Checking recording status for memorial:', params.memorialId);

	try {
		const { memorialId } = params;
		
		// Verify livestream permissions
		const memorialRequest = createMemorialRequest(memorialId, locals);
		const accessResult = await requireLivestreamAccess(memorialRequest);
		
		console.log('✅ Archive management access verified:', accessResult.reason);

		// Get memorial document
		const memorialRef = adminDb.collection('memorials').doc(memorialId);
		const memorialDoc = await memorialRef.get();

		if (!memorialDoc.exists) {
			return json({ error: 'Memorial not found' }, { status: 404 });
		}

		const memorial = memorialDoc.data();
		const archive = memorial?.livestreamArchive || [];

		if (archive.length === 0) {
			return json({
				success: true,
				message: 'No archive entries to check',
				updated: 0
			});
		}

		console.log('📊 Checking', archive.length, 'archive entries');

		let updatedCount = 0;
		const updatedArchive = [];

		for (const entry of archive) {
			let updatedEntry = { ...entry };

			// Skip if already marked as ready
			if (entry.recordingReady) {
				console.log('✅ Entry already ready:', entry.title);
				updatedArchive.push(updatedEntry);
				continue;
			}

			// Check Cloudflare for recording status
			if (entry.cloudflareId) {
				try {
					console.log('🔍 Checking Cloudflare recording for:', entry.cloudflareId);
					
					const videoResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/${entry.cloudflareId}`, {
						headers: {
							'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
							'Content-Type': 'application/json'
						}
					});

					if (videoResponse.ok) {
						const videoData = await videoResponse.json();
						const video = videoData.result;
						
						console.log('🎥 Video status:', video.status, 'for', entry.title);
						
						if (video.status === 'ready' && video.playback) {
							// Recording is ready, update the entry
							// For iframe embedding, we still use the same Cloudflare iframe URL
							// Cloudflare automatically switches from live to recording content
							updatedEntry = {
								...updatedEntry,
								recordingReady: true,
								recordingPlaybackUrl: `https://cloudflarestream.com/${entry.cloudflareId}/iframe`, // Use iframe URL for embedding
								recordingHlsUrl: video.playback.hls || '', // Store HLS for direct playback if needed
								recordingDashUrl: video.playback.dash || '', // Store DASH for direct playback if needed
								recordingThumbnail: video.thumbnail || '',
								recordingDuration: video.duration || null,
								recordingSize: video.size || null,
								playbackUrl: `https://cloudflarestream.com/${entry.cloudflareId}/iframe`, // Use iframe URL
								updatedAt: new Date()
							};
							
							updatedCount++;
							console.log('✅ Updated recording for:', entry.title);
						} else {
							console.log('⏳ Recording not ready for:', entry.title, 'status:', video.status);
						}
					} else {
						console.warn('⚠️ Could not fetch video data for:', entry.cloudflareId, 'status:', videoResponse.status);
					}
				} catch (error) {
					console.warn('⚠️ Error checking recording for:', entry.cloudflareId, error);
				}
			}

			updatedArchive.push(updatedEntry);
		}

		// Update memorial with the updated archive
		if (updatedCount > 0) {
			await memorialRef.update({
				livestreamArchive: updatedArchive
			});
			console.log('✅ Updated', updatedCount, 'archive entries');
		}

		return json({
			success: true,
			message: `Checked ${archive.length} entries, updated ${updatedCount}`,
			totalEntries: archive.length,
			updated: updatedCount,
			archive: updatedArchive
		});

	} catch (error) {
		console.error('💥 Error checking recordings:', error);
		return json(
			{ error: 'Failed to check recordings', details: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 }
		);
	}
};
