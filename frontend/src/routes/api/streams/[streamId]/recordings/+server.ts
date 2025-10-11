import { adminDb } from '$lib/server/firebase';
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

// GET - Get Cloudflare Stream recordings for a stream
export const GET: RequestHandler = async ({ params }) => {
	const { streamId } = params;

	console.log('🎥 [RECORDINGS] Fetching recordings for stream:', streamId);

	try {
		// Get stream from database
		const streamDoc = await adminDb.collection('streams').doc(streamId).get();

		if (!streamDoc.exists) {
			return json(
				{
					success: false,
					error: 'Stream not found'
				},
				{ status: 404 }
			);
		}

		const stream = streamDoc.data()!;
		const cloudflareInputId = stream.cloudflareInputId;

		if (!cloudflareInputId) {
			return json(
				{
					success: false,
					error: 'No Cloudflare Input ID found for this stream'
				},
				{ status: 400 }
			);
		}

		console.log('🔍 [RECORDINGS] Checking recordings for Live Input:', cloudflareInputId);

		// Method 1: Try the direct videos endpoint for Live Input (per Cloudflare docs)
		let recordings = [];
		try {
			const videosUrl = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/stream/live_inputs/${cloudflareInputId}/videos`;

			console.log('🔍 [RECORDINGS] Trying direct videos endpoint:', videosUrl);

			const videosResponse = await fetch(videosUrl, {
				headers: {
					Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
					'Content-Type': 'application/json'
				}
			});

			const videosData = await videosResponse.json();
			console.log('📡 [RECORDINGS] Videos endpoint response:', JSON.stringify(videosData, null, 2));

			if (videosResponse.ok && videosData.success && videosData.result) {
				recordings = Array.isArray(videosData.result) ? videosData.result : [];
				console.log('✅ [RECORDINGS] Found', recordings.length, 'recordings via videos endpoint');
			} else {
				console.log(
					'⚠️ [RECORDINGS] Videos endpoint failed:',
					videosData.errors?.[0]?.message || 'Unknown error'
				);
			}
		} catch (error) {
			console.log('⚠️ [RECORDINGS] Videos endpoint error:', error);
		}

		// Method 2: If no direct videos endpoint, search all streams
		if (recordings.length === 0) {
			const streamsUrl = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/stream`;

			const streamsResponse = await fetch(streamsUrl, {
				headers: {
					Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
					'Content-Type': 'application/json'
				}
			});

			if (!streamsResponse.ok) {
				throw new Error(`Streams API error: ${streamsResponse.status}`);
			}

			const streamsData = await streamsResponse.json();

			// Filter streams associated with this Live Input
			recordings = streamsData.result.filter((cfStream: any) => {
				return (
					cfStream.input?.uid === cloudflareInputId ||
					cfStream.liveInput === cloudflareInputId ||
					cfStream.meta?.name?.includes(cloudflareInputId)
				);
			});

			console.log('🔍 [RECORDINGS] Found', recordings.length, 'recordings via streams search');
		}

		// Process recordings to extract useful information
		const processedRecordings = recordings.map((recording: any) => ({
			uid: recording.uid,
			status: recording.status,
			duration: recording.duration,
			created: recording.created,
			modified: recording.modified,
			meta: recording.meta,
			playback: recording.playback,
			preview: recording.preview,
			thumbnail: recording.thumbnail,
			size: recording.size,
			input: recording.input,
			liveInput: recording.liveInput,
			// Extract playback URLs
			playbackUrls: {
				hls: recording.playback?.hls,
				dash: recording.playback?.dash
			},
			// Check if ready for playback
			isReady: recording.status?.state === 'ready',
			readyToStream: recording.readyToStream
		}));

		// Update our database with recording information if found
		if (processedRecordings.length > 0) {
			console.log('💾 [RECORDINGS] Preparing database update for stream:', streamId);
			const latestRecording = processedRecordings[0]; // Most recent

			const updateData: any = {
				updatedAt: new Date().toISOString(),
				cloudflareRecordings: processedRecordings,
				recordingCount: processedRecordings.length
			};

			console.log('💾 [RECORDINGS] Base update data:', {
				recordingCount: updateData.recordingCount,
				hasCloudflareRecordings: !!updateData.cloudflareRecordings
			});

			// If we have a ready recording, update the main recording fields
			const readyRecording = processedRecordings.find((r) => r.isReady);
			console.log('💾 [RECORDINGS] Ready recording check:', {
				totalRecordings: processedRecordings.length,
				readyRecordings: processedRecordings.filter((r) => r.isReady).length,
				hasReadyRecording: !!readyRecording,
				readyRecordingUid: readyRecording?.uid
			});

			if (readyRecording) {
				console.log('✅ [RECORDINGS] Found ready recording, updating main fields:', {
					uid: readyRecording.uid,
					duration: readyRecording.duration,
					hlsUrl: readyRecording.playbackUrls.hls,
					dashUrl: readyRecording.playbackUrls.dash
				});

				updateData.cloudflareStreamId = readyRecording.uid;
				updateData.recordingReady = true;
				updateData.recordingPlaybackUrl =
					readyRecording.playbackUrls.hls || readyRecording.playbackUrls.dash;
				updateData.recordingThumbnail = readyRecording.thumbnail;
				updateData.recordingDuration = readyRecording.duration;
				updateData.recordingSize = readyRecording.size;
				updateData.recordingProcessedAt = new Date().toISOString();

				// If stream is still scheduled but has recordings, mark it as completed
				if (stream.status === 'scheduled') {
					updateData.status = 'completed';
					updateData.endedAt = readyRecording.created; // Use recording creation time
					console.log('📝 [RECORDINGS] Marking scheduled stream as completed due to recording');
				}
			} else {
				console.log('⚠️ [RECORDINGS] No ready recordings found, keeping recordingReady as false');
			}

			await adminDb.collection('streams').doc(streamId).update(updateData);
			console.log('✅ [RECORDINGS] Updated stream with recording data:', {
				streamId,
				recordingReady: updateData.recordingReady,
				recordingPlaybackUrl: updateData.recordingPlaybackUrl,
				status: updateData.status,
				recordingCount: updateData.recordingCount
			});
		}

		return json({
			success: true,
			streamId,
			cloudflareInputId,
			recordings: processedRecordings,
			recordingCount: processedRecordings.length,
			readyRecordings: processedRecordings.filter((r) => r.isReady).length,
			latestRecording: processedRecordings[0] || null
		});
	} catch (error: any) {
		console.error('❌ [RECORDINGS] Error fetching recordings:', error);

		return json(
			{
				success: false,
				error: error.message,
				streamId
			},
			{ status: 500 }
		);
	}
};
